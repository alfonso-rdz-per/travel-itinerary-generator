"use server";

import { createClient } from "@/services/supabase/server";
import { unsplashGet } from "@/services/unsplash/client";
import { searchPhotos } from "@/services/unsplash/searchPhotos";
import { buildDayImage } from "@/services/unsplash/attribution";
import { triggerDownload } from "@/services/unsplash/downloadTracking";
import { getUnsplashErrorMessage } from "@/utils/errorMessages";
import { isUnsplashPhoto } from "@/types/unsplash";
import type { ItineraryDayImage, ItineraryJsonData } from "@/types/itinerary";

/**
 * Cambiar/buscar/eliminar la imagen de un día (Fase 10). Reutiliza
 * íntegramente services/unsplash/* (búsqueda, atribución, download
 * tracking) — nada de esto duplica la lógica ya usada en la Fase 6 durante
 * la generación automática. Cada Server Action re-deriva el usuario desde la
 * sesión del servidor y vuelve a verificar que el itinerario le pertenezca
 * antes de tocar la base de datos, igual que el resto del editor.
 */

export type ImageSearchResult = {
  id: string;
  thumbUrl: string;
  photographer: string;
  width: number;
  height: number;
};

export type SearchDayImagesResult =
  | { success: true; results: ImageSearchResult[] }
  | { success: false; error: string };

/** Busca en Unsplash exactamente el texto que escribió el agente — nunca lo modifica. */
export async function searchDayImages(itineraryId: string, query: string): Promise<SearchDayImagesResult> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { success: false, error: "Escribe qué imagen quieres buscar." };
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
    .select("id")
    .eq("id", itineraryId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !row) {
    return { success: false, error: "No se encontró el itinerario." };
  }

  try {
    const candidates = await searchPhotos(trimmed);
    return {
      success: true,
      results: candidates.map(({ photo }) => ({
        id: photo.id,
        thumbUrl: photo.urls.small,
        photographer: photo.user.name,
        width: photo.width,
        height: photo.height,
      })),
    };
  } catch (error) {
    console.error("[searchDayImages]", error);
    return { success: false, error: getUnsplashErrorMessage(error) };
  }
}

export type SetDayImageResult = { success: true; image: ItineraryDayImage } | { success: false; error: string };

/** Carga la fila, valida ownership + rango de día, y aplica `update` sobre `image` de ese día únicamente. */
async function applyDayImageUpdate(
  itineraryId: string,
  dayIndex: number,
  buildImage: () => Promise<ItineraryDayImage>,
): Promise<SetDayImageResult> {
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
    .eq("id", itineraryId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !row) {
    return { success: false, error: "No se encontró el itinerario." };
  }

  const jsonData = row.json_data as ItineraryJsonData;
  const generated = jsonData.generated;

  if (!generated || dayIndex < 0 || dayIndex >= generated.days.length) {
    return { success: false, error: "No se pudo actualizar la imagen. Recarga la página e intenta de nuevo." };
  }

  let image: ItineraryDayImage;
  try {
    image = await buildImage();
  } catch (error) {
    console.error("[applyDayImageUpdate] build", error);
    return { success: false, error: getUnsplashErrorMessage(error) };
  }

  const days = generated.days.map((day, index) => (index === dayIndex ? { ...day, image } : day));
  const updatedGenerated = { ...generated, days };

  const { error: updateError } = await supabase
    .from("itineraries")
    .update({ json_data: { ...jsonData, generated: updatedGenerated } })
    .eq("id", itineraryId)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("[applyDayImageUpdate] update", updateError);
    return { success: false, error: "No se pudo guardar la imagen. Intenta de nuevo." };
  }

  return { success: true, image };
}

/**
 * Asigna la foto elegida por el agente a un día. Nunca confía en la
 * atribución/medidas que pudiera enviar el navegador: solo recibe el `id`
 * de la foto y la búsqueda que la produjo, y reconstruye todo lo demás
 * (atribución, dimensiones, colores, urls) pidiéndoselo de nuevo a Unsplash
 * — el mismo `buildDayImage` de la Fase 6, sin duplicar lógica.
 */
export async function selectDayImage(
  itineraryId: string,
  dayIndex: number,
  photoId: string,
  query: string,
): Promise<SetDayImageResult> {
  const trimmedQuery = query.trim();
  if (!photoId || !trimmedQuery) {
    return { success: false, error: "Selección inválida." };
  }

  return applyDayImageUpdate(itineraryId, dayIndex, async () => {
    const raw = await unsplashGet(`/photos/${encodeURIComponent(photoId)}`, {});
    if (!isUnsplashPhoto(raw)) {
      throw new Error("Unsplash devolvió una foto con datos incompletos.");
    }
    // Best-effort (Fase 6): nunca debe impedir guardar la imagen elegida.
    await triggerDownload(raw);
    return buildDayImage(raw, trimmedQuery);
  });
}

/**
 * Elimina explícitamente la imagen de un día — no es "no se encontró nada",
 * es una decisión del agente. El PDF debe respetar esto y nunca mostrar
 * default-day.jpg para este día (ver features/pdf/generatePdf.tsx).
 */
export async function removeDayImage(itineraryId: string, dayIndex: number): Promise<SetDayImageResult> {
  return applyDayImageUpdate(itineraryId, dayIndex, async () => ({ source: "none" }));
}
