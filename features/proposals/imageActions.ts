"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/services/supabase/server";
import { unsplashGet } from "@/services/unsplash/client";
import { searchPhotos } from "@/services/unsplash/searchPhotos";
import { buildDayImage } from "@/services/unsplash/attribution";
import { triggerDownload } from "@/services/unsplash/downloadTracking";
import { getUnsplashErrorMessage } from "@/utils/errorMessages";
import { isUnsplashPhoto } from "@/types/unsplash";
import type { Json } from "@/types/database";
import type { ProposalImage, ProposalJsonData } from "@/types/proposal";

/**
 * Cambiar / buscar / eliminar la imagen de destino de una propuesta ya
 * generada — el equivalente al selector manual de imagen del editor de
 * itinerarios (Fase 10). Reutiliza íntegramente services/unsplash/*
 * (búsqueda, atribución, download tracking); no duplica lógica de la
 * generación automática. Cada Server Action re-deriva el usuario desde la
 * sesión y verifica que la propuesta le pertenezca antes de tocar la BD.
 */

export type ImageSearchResult = {
  id: string;
  thumbUrl: string;
  photographer: string;
  width: number;
  height: number;
};

export type SearchProposalImagesResult =
  | { success: true; results: ImageSearchResult[] }
  | { success: false; error: string };

/** Busca en Unsplash exactamente el texto que escribió el agente — nunca lo modifica. */
export async function searchProposalImages(
  proposalId: string,
  query: string,
): Promise<SearchProposalImagesResult> {
  const trimmed = query.trim();
  if (!trimmed) return { success: false, error: "Escribe qué imagen quieres buscar." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Tu sesión expiró. Inicia sesión de nuevo." };

  const { data: row, error } = await supabase
    .from("proposals")
    .select("id")
    .eq("id", proposalId)
    .eq("user_id", user.id)
    .single();

  if (error || !row) return { success: false, error: "No se encontró la propuesta." };

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
  } catch (searchError) {
    console.error("[searchProposalImages]", searchError);
    return { success: false, error: getUnsplashErrorMessage(searchError) };
  }
}

export type SetProposalImageResult =
  | { success: true; image: ProposalImage }
  | { success: false; error: string };

async function applyProposalImageUpdate(
  proposalId: string,
  buildImage: () => Promise<ProposalImage>,
): Promise<SetProposalImageResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Tu sesión expiró. Inicia sesión de nuevo." };

  const { data: row, error: fetchError } = await supabase
    .from("proposals")
    .select("json_data")
    .eq("id", proposalId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !row) return { success: false, error: "No se encontró la propuesta." };

  const jsonData = row.json_data as unknown as ProposalJsonData;
  const generated = jsonData?.generated;
  if (!generated) {
    return { success: false, error: "Esta propuesta todavía no ha sido generada." };
  }

  let image: ProposalImage;
  try {
    image = await buildImage();
  } catch (buildError) {
    console.error("[applyProposalImageUpdate] build", buildError);
    return { success: false, error: getUnsplashErrorMessage(buildError) };
  }

  const updatedGenerated = { ...generated, image };
  const { error: updateError } = await supabase
    .from("proposals")
    .update({ json_data: { ...jsonData, generated: updatedGenerated } as unknown as Json })
    .eq("id", proposalId)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("[applyProposalImageUpdate] update", updateError);
    return { success: false, error: "No se pudo guardar la imagen. Intenta de nuevo." };
  }

  revalidatePath(`/proposals/${proposalId}`);
  return { success: true, image };
}

/**
 * Asigna la foto elegida por el agente. Nunca confía en la atribución/medidas
 * que envíe el navegador: sólo recibe el `id` de la foto y la búsqueda que la
 * produjo, y reconstruye todo lo demás pidiéndoselo de nuevo a Unsplash — el
 * mismo `buildDayImage` de la generación, sin duplicar lógica.
 */
export async function selectProposalImage(
  proposalId: string,
  photoId: string,
  query: string,
): Promise<SetProposalImageResult> {
  const trimmedQuery = query.trim();
  if (!photoId || !trimmedQuery) return { success: false, error: "Selección inválida." };

  return applyProposalImageUpdate(proposalId, async () => {
    const raw = await unsplashGet(`/photos/${encodeURIComponent(photoId)}`, {});
    if (!isUnsplashPhoto(raw)) {
      throw new Error("Unsplash devolvió una foto con datos incompletos.");
    }
    await triggerDownload(raw); // best-effort, nunca impide guardar
    return buildDayImage(raw, trimmedQuery);
  });
}

/** Elimina la imagen de la propuesta: decisión del agente, el PDF no mostrará ninguna. */
export async function removeProposalImage(proposalId: string): Promise<SetProposalImageResult> {
  return applyProposalImageUpdate(proposalId, async () => ({ source: "none" }));
}
