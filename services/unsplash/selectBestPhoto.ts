import "server-only";
import type { RankedPhoto } from "@/types/unsplash";

/** ~Full HD: umbral generoso para considerar una foto de "alta resolución". */
const TARGET_PIXELS = 1920 * 1080;

const WEIGHTS = {
  relevance: 0.4,
  orientation: 0.25,
  resolution: 0.2,
  popularity: 0.15,
};

function scoreCandidate(candidate: RankedPhoto, maxLikes: number): number {
  const { photo, rank, poolSize } = candidate;

  // Unsplash ya ordena por relevancia dentro de cada búsqueda: rank 0 = más relevante.
  const relevance = poolSize > 1 ? 1 - rank / (poolSize - 1) : 1;
  // Horizontal se lee mejor como imagen principal de una página del PDF.
  const orientation = photo.width >= photo.height ? 1 : 0.5;
  const resolution = Math.min((photo.width * photo.height) / TARGET_PIXELS, 1);
  // "likes" como aproximación disponible de calidad/composición (Unsplash no expone un score de calidad).
  const popularity = maxLikes > 0 ? photo.likes / maxLikes : 0;

  return (
    relevance * WEIGHTS.relevance +
    orientation * WEIGHTS.orientation +
    resolution * WEIGHTS.resolution +
    popularity * WEIGHTS.popularity
  );
}

/**
 * Elige, entre todos los candidatos reunidos para un día (pueden venir de
 * varias actividades y varias búsquedas distintas), la fotografía que mejor
 * representa el día completo — nunca simplemente la primera del primer
 * resultado.
 */
export function selectBestPhoto<T extends RankedPhoto>(candidates: T[]): T | null {
  if (candidates.length === 0) return null;

  const maxLikes = Math.max(...candidates.map((c) => c.photo.likes));

  let best = candidates[0];
  let bestScore = scoreCandidate(best, maxLikes);

  for (let i = 1; i < candidates.length; i++) {
    const score = scoreCandidate(candidates[i], maxLikes);
    if (score > bestScore) {
      best = candidates[i];
      bestScore = score;
    }
  }

  return best;
}
