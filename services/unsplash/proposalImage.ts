import "server-only";
import { searchPhotos } from "./searchPhotos";
import { selectBestPhoto } from "./selectBestPhoto";
import { buildDayImage } from "./attribution";
import { triggerDownload } from "./downloadTracking";
import { getUnsplashErrorMessage } from "@/utils/errorMessages";
import type { SourcedPhoto } from "@/types/unsplash";
import type { ProposalImage } from "@/types/proposal";

/**
 * Imagen representativa del destino para la propuesta, reutilizando íntegro el
 * pipeline de imágenes de itinerarios (búsqueda exacta → mejor foto → atribución
 * con UTM → download tracking). Nunca lanza: si Unsplash falla o no hay
 * resultados, devuelve `{ source: "none" }` y la propuesta se muestra sin foto.
 *
 * A diferencia de los itinerarios, aquí solo se busca una imagen (la del
 * destino principal), con una alternativa razonable al primer lugar capturado
 * por el agente — nunca se inventan palabras clave.
 */
export async function resolveProposalDestinationImage(
  destination: string,
  fallbackPlace?: string,
): Promise<ProposalImage> {
  if (!process.env.UNSPLASH_ACCESS_KEY) {
    console.error("[unsplash] UNSPLASH_ACCESS_KEY no está configurada; la propuesta no llevará imagen.");
    return { source: "none" };
  }

  const queries = [destination.trim(), (fallbackPlace ?? "").trim()].filter(
    (query, index, all) => query.length > 0 && all.indexOf(query) === index,
  );

  const candidates: SourcedPhoto[] = [];

  for (const query of queries) {
    try {
      const photos = await searchPhotos(query);
      candidates.push(...photos.map((photo) => ({ ...photo, query })));
      if (candidates.length > 0) break;
    } catch (error) {
      console.error("[unsplash] error al buscar la imagen de la propuesta:", getUnsplashErrorMessage(error));
    }
  }

  const best = selectBestPhoto(candidates);
  if (!best) return { source: "none" };

  await triggerDownload(best.photo);
  return buildDayImage(best.photo, best.query);
}
