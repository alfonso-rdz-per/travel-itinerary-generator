"use server";

import { createClient } from "@/services/supabase/server";
import { getDefaultDayImage } from "@/services/unsplash/defaultImage";
import { editorItineraryContentSchema } from "@/types/itinerary";
import type { EditorItineraryContent, EnrichedDay, EnrichedItinerary, ItineraryJsonData } from "@/types/itinerary";

export type UpdateItineraryResult = { success: true } | { success: false; error: string };

/**
 * Guarda el contenido editado del itinerario (resumen, días, actividades,
 * recomendaciones, consejos, y ahora también agregar/eliminar/reordenar
 * días completos — Fase 9A). Nunca confía en lo que envía el navegador para
 * `image`/`metadata` de cada día: siempre se preservan los valores ya
 * guardados en la base de datos (Fases 5 y 6), nunca los del cliente.
 *
 * `dayOrigins[i]` indica de qué posición del itinerario ya guardado viene
 * `content.days[i]` (o `null` si el día se creó en el editor) — solo se usa
 * para decidir de dónde copiar `image`, nunca para ningún otro dato; un
 * índice manipulado o fuera de rango simplemente cae al día por defecto.
 */
export async function updateItineraryContent(
  id: string,
  content: EditorItineraryContent,
  dayOrigins: (number | null)[],
): Promise<UpdateItineraryResult> {
  const parsed = editorItineraryContentSchema.safeParse(content);

  if (!parsed.success) {
    console.error("[updateItineraryContent] contenido inválido", parsed.error.flatten());
    return { success: false, error: "Los cambios no tienen un formato válido. Recarga la página e intenta de nuevo." };
  }

  if (dayOrigins.length !== parsed.data.days.length) {
    return { success: false, error: "No se pudo guardar. Recarga la página e intenta de nuevo." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Tu sesión expiró. Inicia sesión de nuevo." };
  }

  const { data: row, error: fetchError } = await supabase
    .from("itineraries")
    .select("json_data")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !row) {
    console.error("[updateItineraryContent] fetch", fetchError);
    return { success: false, error: "No se encontró el itinerario." };
  }

  const existingJsonData = row.json_data as ItineraryJsonData;
  const existingGenerated = existingJsonData.generated;

  if (!existingGenerated) {
    return { success: false, error: "Este itinerario todavía no ha sido generado." };
  }

  const days: EnrichedDay[] = parsed.data.days.map((day, index) => {
    const originIndex = dayOrigins[index];
    const original =
      originIndex !== null && originIndex >= 0 && originIndex < existingGenerated.days.length
        ? existingGenerated.days[originIndex]
        : undefined;
    // Día nuevo (agregado en el editor) o índice fuera de rango: nunca tuvo
    // una foto real de Unsplash asignada, usa la imagen local de respaldo —
    // igual que cuando Unsplash falla por completo en la generación.
    return { ...day, image: original?.image ?? getDefaultDayImage([]) };
  });

  const updatedGenerated: EnrichedItinerary = {
    overview: parsed.data.overview,
    days,
    metadata: existingGenerated.metadata,
  };

  const { error: updateError } = await supabase
    .from("itineraries")
    .update({ json_data: { ...existingJsonData, generated: updatedGenerated } })
    .eq("id", id)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("[updateItineraryContent] update", updateError);
    return { success: false, error: "No se pudo guardar. Intenta de nuevo." };
  }

  return { success: true };
}
