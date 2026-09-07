import "server-only";
import { unsplashGet } from "./client";
import { isUnsplashPhoto, type RankedPhoto, type UnsplashSearchResponse } from "@/types/unsplash";

const RESULTS_PER_SEARCH = 6;

/**
 * Busca en Unsplash exactamente el texto recibido — nunca lo modifica ni
 * inventa palabras clave adicionales. `content_filter: "high"` mantiene los
 * resultados apropiados para un documento profesional de la agencia.
 */
export async function searchPhotos(query: string): Promise<RankedPhoto[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  const raw = (await unsplashGet("/search/photos", {
    query: trimmed,
    per_page: String(RESULTS_PER_SEARCH),
    content_filter: "high",
  })) as UnsplashSearchResponse;

  const photos = Array.isArray(raw?.results) ? raw.results.filter(isUnsplashPhoto) : [];

  return photos.map((photo, index) => ({ photo, rank: index, poolSize: photos.length }));
}
