"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import { generateItinerary as generateItineraryContent } from "@/services/gemini/generateItinerary";
import { toGeminiTripInput } from "@/services/gemini/tripInput";
import { enrichItineraryWithImages } from "@/services/unsplash/enrichItinerary";
import { getGeminiErrorMessage } from "@/utils/errorMessages";
import { itineraryFormSchema, type ItineraryFormValues } from "./schema";

export type CreateDraftResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export type GenerateItineraryResult =
  | { success: true }
  // `id`: el registro asociado a este intento (nuevo o el `existingId` que ya
  // traía el formulario). El cliente lo guarda para que un reintento o un
  // "Guardar Itinerario" posterior reutilicen el mismo registro en vez de
  // crear uno nuevo — ver features/itinerary-form/components/ItineraryForm.tsx.
  | { success: false; error: string; fieldErrors?: Record<string, string[]>; id?: string };

/**
 * Guarda como borrador. Si `existingId` viene de un intento previo (otro
 * "Guardar" o un "Generar" que falló en este mismo formulario), actualiza
 * ESE registro en vez de insertar uno nuevo — un mismo trabajo del agente
 * nunca debe producir dos filas en Supabase (Fase 9A/10).
 */
export async function createDraftItinerary(
  input: ItineraryFormValues,
  existingId?: string,
): Promise<CreateDraftResult> {
  const parsed = itineraryFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Revisa los campos marcados antes de guardar.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Tu sesión expiró. Inicia sesión de nuevo." };
  }

  const { passengerName, destination, startDate, endDate, observations, flights, days } = parsed.data;

  const record = {
    user_id: user.id,
    passenger_name: passengerName,
    destination,
    start_date: startDate,
    end_date: endDate,
    observations: observations && observations.length > 0 ? observations : null,
    status: "draft" as const,
    json_data: { input: { days, flights } },
  };

  if (existingId) {
    const { error, count } = await supabase
      .from("itineraries")
      .update(record, { count: "exact" })
      .eq("id", existingId)
      .eq("user_id", user.id);

    if (error || !count) {
      console.error("[createDraftItinerary] update", error);
      return { success: false, error: "No se pudo guardar el borrador. Intenta de nuevo." };
    }
  } else {
    const { error } = await supabase.from("itineraries").insert(record);

    if (error) {
      console.error("[createDraftItinerary] insert", error);
      return { success: false, error: "No se pudo guardar el borrador. Intenta de nuevo." };
    }
  }

  redirect("/dashboard?created=draft");
}

/**
 * Genera con IA. Si `existingId` viene de un intento previo en este mismo
 * formulario (reintento tras un error, o retomar un borrador), actualiza ESE
 * registro en vez de insertar uno nuevo. En caso de error, siempre devuelve
 * `id` — el formulario lo conserva para que cualquier acción siguiente
 * (reintentar, guardar como borrador, o ir al dashboard a eliminarlo) opere
 * sobre el mismo registro, nunca sobre uno nuevo.
 */
export async function generateItinerary(
  input: ItineraryFormValues,
  existingId?: string,
): Promise<GenerateItineraryResult> {
  const parsed = itineraryFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      success: false,
      error: "Revisa los campos marcados antes de generar el itinerario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Tu sesión expiró. Inicia sesión de nuevo." };
  }

  const { passengerName, destination, startDate, endDate, observations, flights, days } = parsed.data;

  const baseRecord = {
    user_id: user.id,
    passenger_name: passengerName,
    destination,
    start_date: startDate,
    end_date: endDate,
    observations: observations && observations.length > 0 ? observations : null,
    status: "generating" as const,
    json_data: { input: { days, flights } },
  };

  let id: string;

  if (existingId) {
    const { error: updateError, count } = await supabase
      .from("itineraries")
      .update(baseRecord, { count: "exact" })
      .eq("id", existingId)
      .eq("user_id", user.id);

    if (updateError || !count) {
      console.error("[generateItinerary] update(existing)", updateError);
      return { success: false, error: "No se pudo iniciar la generación. Intenta de nuevo." };
    }
    id = existingId;
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from("itineraries")
      .insert(baseRecord)
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error("[generateItinerary] insert", insertError);
      return { success: false, error: "No se pudo iniciar la generación. Intenta de nuevo." };
    }
    id = inserted.id;
  }

  let imagesIncomplete = false;

  try {
    const tripInput = toGeminiTripInput({ passengerName, destination, startDate, endDate, days });
    const generated = await generateItineraryContent(tripInput);

    const enriched = await enrichItineraryWithImages(generated, destination);
    imagesIncomplete = enriched.imagesIncomplete;

    // Los "Datos" manuales del formulario (texto libre del agente) se adjuntan
    // aquí a cada día: la IA nunca los vio ni los produjo. El orden y número de
    // días ya coincide con lo enviado (validado en generateItineraryContent).
    const generatedWithNotes = {
      ...enriched.itinerary,
      days: enriched.itinerary.days.map((day, index) => ({
        ...day,
        manualNotes: days[index]?.manualNotes ?? [],
      })),
    };

    const { error: updateError } = await supabase
      .from("itineraries")
      .update({ status: "ready", json_data: { input: { days, flights }, generated: generatedWithNotes } })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("[generateItinerary] update", updateError);
      // El contenido generado se conserva en `generated` para no perder el
      // trabajo de Gemini/Unsplash, pero el registro nunca debe quedar
      // colgado en 'generating': sin este update, la fila sería imposible
      // de editar o reintentar desde la UI.
      await supabase
        .from("itineraries")
        .update({ status: "error", json_data: { input: { days, flights }, generated: generatedWithNotes } })
        .eq("id", id)
        .eq("user_id", user.id);
      return {
        success: false,
        error: "El itinerario se generó, pero no se pudo guardar. Intenta de nuevo.",
        id,
      };
    }
  } catch (error) {
    console.error("[generateItinerary] gemini", error);
    await supabase.from("itineraries").update({ status: "error" }).eq("id", id).eq("user_id", user.id);
    return { success: false, error: getGeminiErrorMessage(error), id };
  }

  redirect(`/dashboard?created=generated${imagesIncomplete ? "&imagesIncomplete=1" : ""}`);
}
