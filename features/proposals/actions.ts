"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/services/supabase/server";
import { generateProposalContent } from "@/services/gemini/proposal/generateProposal";
import { resolveProposalDestinationImage } from "@/services/unsplash/proposalImage";
import { getGeminiErrorMessage } from "@/utils/errorMessages";
import { deleteProposalPdf } from "./pdf/storage";
import { fieldErrorsFromZod, proposalFormSchema, type ProposalFormValues } from "./schema";
import type { Database, Json } from "@/types/database";
import type { ProposalGenerated, ProposalInput, ProposalJsonData } from "@/types/proposal";
import { PROPOSAL_LIST_COLUMNS, toProposalListItem, type ProposalListItem } from "./types";

type ProposalInsert = Database["public"]["Tables"]["proposals"]["Insert"];

/** json_data es `jsonb`: la forma la garantizan types/proposal.ts + Zod, no el tipo genérico `Json`. */
function asJson(data: ProposalJsonData): Json {
  return data as unknown as Json;
}

export type ProposalActionResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]>; id?: string };

export type RegenerateResult = { success: true } | { success: false; error: string };

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

function toColumns(values: ProposalFormValues): Omit<ProposalInsert, "user_id" | "status" | "json_data"> {
  return {
    client_name: values.client.name,
    client_email: values.client.email || null,
    client_phone: values.client.phone || null,
    destination: values.trip.destination,
    start_date: values.trip.startDate || null,
    end_date: values.trip.endDate || null,
    num_days: values.trip.numDays,
    num_travelers: values.trip.numTravelers,
    trip_type: values.trip.tripType || null,
    title: values.proposal.title || null,
    currency: values.currency,
  };
}

/** El `input` que se guarda en json_data. Los precios viven aquí y solo aquí. */
function toInput(values: ProposalFormValues): ProposalInput {
  return {
    client: values.client,
    trip: values.trip,
    proposal: values.proposal,
    currency: values.currency,
    services: values.services,
  };
}

/** Ejecuta IA + imagen de Unsplash a partir del input ya guardado. */
async function buildGenerated(input: ProposalInput): Promise<ProposalGenerated> {
  const content = await generateProposalContent(input);
  const image = await resolveProposalDestinationImage(
    input.trip.destination,
    input.services.find((service) => service.place.trim().length > 0)?.place,
  );
  const { metadata, ...ai } = content;
  return { ...ai, image, metadata };
}

async function getUserOrError() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/* -------------------------------------------------------------------------- */
/* Guardar sin regenerar                                                       */
/*                                                                            */
/* Propuesta nueva  → guarda el input como borrador (aún sin texto de IA).     */
/* Propuesta existente → guarda los cambios del formulario CONSERVANDO el      */
/*   texto ya generado (no vuelve a llamar a la IA). Útil para corregir datos  */
/*   menores sin esperar la regeneración. El texto de IA puede quedar          */
/*   ligeramente desfasado hasta que el agente use "Regenerar texto".          */
/* -------------------------------------------------------------------------- */

export async function saveProposalDraft(
  values: ProposalFormValues,
  existingId?: string,
): Promise<ProposalActionResult> {
  const parsed = proposalFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Revisa los campos marcados antes de guardar.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const { supabase, user } = await getUserOrError();
  if (!user) return { success: false, error: "Tu sesión expiró. Inicia sesión de nuevo." };

  const input = toInput(parsed.data);
  const columns = toColumns(parsed.data);

  if (existingId) {
    const { data: existing, error: fetchError } = await supabase
      .from("proposals")
      .select("json_data, status")
      .eq("id", existingId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existing) {
      console.error("[saveProposalDraft] fetch", fetchError);
      return { success: false, error: "No se encontró la propuesta." };
    }

    const existingGenerated = (existing.json_data as ProposalJsonData)?.generated;
    const { error, count } = await supabase
      .from("proposals")
      .update(
        {
          ...columns,
          // Conserva el texto de IA ya generado (si lo hay); no se pierde al
          // corregir un dato del formulario.
          json_data: asJson(existingGenerated ? { input, generated: existingGenerated } : { input }),
          status: existingGenerated ? "ready" : "draft",
        },
        { count: "exact" },
      )
      .eq("id", existingId)
      .eq("user_id", user.id);

    if (error || !count) {
      console.error("[saveProposalDraft] update", error);
      return { success: false, error: "No se pudo guardar. Intenta de nuevo." };
    }
  } else {
    const { error } = await supabase.from("proposals").insert({
      ...columns,
      user_id: user.id,
      status: "draft" as const,
      json_data: asJson({ input }),
    });
    if (error) {
      console.error("[saveProposalDraft] insert", error);
      return { success: false, error: "No se pudo guardar el borrador. Intenta de nuevo." };
    }
  }

  redirect(existingId ? "/proposals?notice=updated" : "/proposals?notice=saved");
}

/* -------------------------------------------------------------------------- */
/* Generar propuesta (desde "Nueva propuesta" o al editar)                     */
/* -------------------------------------------------------------------------- */

export async function generateProposal(
  values: ProposalFormValues,
  existingId?: string,
): Promise<ProposalActionResult> {
  const parsed = proposalFormSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      error: "Revisa los campos marcados antes de generar la propuesta.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const { supabase, user } = await getUserOrError();
  if (!user) return { success: false, error: "Tu sesión expiró. Inicia sesión de nuevo." };

  const input = toInput(parsed.data);
  const baseRecord: ProposalInsert = {
    ...toColumns(parsed.data),
    user_id: user.id,
    status: "generating" as const,
    json_data: asJson({ input }),
  };

  let id: string;
  if (existingId) {
    const { error, count } = await supabase
      .from("proposals")
      .update(baseRecord, { count: "exact" })
      .eq("id", existingId)
      .eq("user_id", user.id);
    if (error || !count) {
      console.error("[generateProposal] update(existing)", error);
      return { success: false, error: "No se pudo iniciar la generación. Intenta de nuevo." };
    }
    id = existingId;
  } else {
    const { data, error } = await supabase.from("proposals").insert(baseRecord).select("id").single();
    if (error || !data) {
      console.error("[generateProposal] insert", error);
      return { success: false, error: "No se pudo iniciar la generación. Intenta de nuevo." };
    }
    id = data.id;
  }

  try {
    const generated = await buildGenerated(input);
    const { error } = await supabase
      .from("proposals")
      .update({
        status: "ready",
        json_data: asJson({ input, generated }),
        // El contenido cambió: el PDF cacheado (si lo hay) queda obsoleto.
        pdf_status: "none",
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("[generateProposal] update(ready)", error);
      await supabase
        .from("proposals")
        .update({ status: "error", json_data: asJson({ input, generated }) })
        .eq("id", id)
        .eq("user_id", user.id);
      return { success: false, error: "La propuesta se generó, pero no se pudo guardar. Intenta de nuevo.", id };
    }
  } catch (error) {
    console.error("[generateProposal] ia", error);
    await supabase.from("proposals").update({ status: "error" }).eq("id", id).eq("user_id", user.id);
    return { success: false, error: getGeminiErrorMessage(error), id };
  }

  // Nueva propuesta → mostramos la previsualización (recién creada, para revisarla
  // y descargarla). Edición → volvemos al listado; la previsualización queda a un
  // clic desde la tarjeta o el botón "Previsualizar" del editor.
  redirect(existingId ? "/proposals?notice=generated" : `/proposals/${id}`);
}

/* -------------------------------------------------------------------------- */
/* Regenerar solo el texto (desde la previsualización)                         */
/* -------------------------------------------------------------------------- */

export async function regenerateProposalText(id: string): Promise<RegenerateResult> {
  const { supabase, user } = await getUserOrError();
  if (!user) return { success: false, error: "Tu sesión expiró. Inicia sesión de nuevo." };

  const { data: row, error: fetchError } = await supabase
    .from("proposals")
    .select("json_data")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !row) return { success: false, error: "No se encontró la propuesta." };

  const jsonData = row.json_data as ProposalJsonData;
  if (!jsonData?.input) return { success: false, error: "Esta propuesta no tiene datos para regenerar." };

  await supabase.from("proposals").update({ status: "generating" }).eq("id", id).eq("user_id", user.id);

  try {
    const generated = await buildGenerated(jsonData.input);
    const { error } = await supabase
      .from("proposals")
      .update({
        status: "ready",
        json_data: asJson({ input: jsonData.input, generated }),
        pdf_status: "none",
      })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) throw error;
  } catch (error) {
    console.error("[regenerateProposalText]", error);
    await supabase.from("proposals").update({ status: "error" }).eq("id", id).eq("user_id", user.id);
    return { success: false, error: getGeminiErrorMessage(error) };
  }

  revalidatePath(`/proposals/${id}`);
  return { success: true };
}

/* -------------------------------------------------------------------------- */
/* Duplicar / eliminar                                                         */
/* -------------------------------------------------------------------------- */

export async function duplicateProposal(id: string): Promise<ProposalActionResult> {
  const { supabase, user } = await getUserOrError();
  if (!user) return { success: false, error: "Tu sesión expiró. Inicia sesión de nuevo." };

  const { data: row, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !row) return { success: false, error: "No se encontró la propuesta a duplicar." };

  const { data: inserted, error: insertError } = await supabase
    .from("proposals")
    .insert({
      user_id: user.id,
      client_name: row.client_name,
      client_email: row.client_email,
      client_phone: row.client_phone,
      destination: row.destination,
      start_date: row.start_date,
      end_date: row.end_date,
      num_days: row.num_days,
      num_travelers: row.num_travelers,
      trip_type: row.trip_type,
      title: row.title ? `${row.title} (copia)` : "Propuesta (copia)",
      currency: row.currency,
      status: row.status === "generating" ? "draft" : row.status,
      json_data: row.json_data,
      // El PDF se regenera bajo demanda para la copia.
      pdf_status: "none",
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    console.error("[duplicateProposal]", insertError);
    return { success: false, error: "No se pudo duplicar la propuesta. Intenta de nuevo." };
  }

  revalidatePath("/proposals");
  redirect("/proposals?notice=duplicated");
}

export type SearchProposalsResult =
  | { success: true; proposals: ProposalListItem[] }
  | { success: false; error: string };

/** Búsqueda por cliente, destino, título o fecha — mismo patrón que searchItineraries. */
export async function searchProposals(rawQuery: string): Promise<SearchProposalsResult> {
  const { supabase, user } = await getUserOrError();
  if (!user) return { success: false, error: "Tu sesión expiró. Inicia sesión de nuevo." };

  const query = rawQuery.trim();
  const base = () => supabase.from("proposals").select(PROPOSAL_LIST_COLUMNS).eq("user_id", user.id);

  if (!query) {
    const { data, error } = await base().order("updated_at", { ascending: false });
    if (error) {
      console.error("[searchProposals] list", error);
      return { success: false, error: "No se pudieron cargar tus propuestas. Intenta de nuevo." };
    }
    return { success: true, proposals: (data ?? []).map(toProposalListItem) };
  }

  const [fullText, allRows] = await Promise.all([
    base().textSearch("search_text", query, { type: "websearch", config: "spanish" }),
    base(),
  ]);

  if (fullText.error || allRows.error) {
    console.error("[searchProposals] search", fullText.error ?? allRows.error);
    return { success: false, error: "No se pudo completar la búsqueda. Intenta de nuevo." };
  }

  const normalized = query.toLowerCase();
  const matched = new Map<string, ProposalListItem>();

  for (const row of fullText.data ?? []) matched.set(row.id, toProposalListItem(row));

  for (const row of allRows.data ?? []) {
    if (matched.has(row.id)) continue;
    const item = toProposalListItem(row);
    const haystack = [item.clientName, item.destination, item.title ?? "", item.startDate ?? "", item.endDate ?? ""]
      .join(" ")
      .toLowerCase();
    if (haystack.includes(normalized)) matched.set(row.id, item);
  }

  const proposals = Array.from(matched.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return { success: true, proposals };
}

export async function deleteProposal(id: string): Promise<RegenerateResult> {
  const { supabase, user } = await getUserOrError();
  if (!user) return { success: false, error: "Tu sesión expiró. Inicia sesión de nuevo." };

  const { error, count } = await supabase
    .from("proposals")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    console.error("[deleteProposal]", error);
    return { success: false, error: "No se pudo eliminar la propuesta. Intenta de nuevo." };
  }
  if (!count) return { success: false, error: "No se encontró la propuesta a eliminar." };

  // Best-effort: quitar el PDF cacheado. Un fallo aquí no revierte el borrado.
  await deleteProposalPdf(supabase, user.id, id).catch((storageError) => {
    console.error("[deleteProposal] pdf storage", storageError);
  });

  revalidatePath("/proposals");
  return { success: true };
}
