import "server-only";
import { searchPhotos } from "./searchPhotos";
import type { RankedPhoto } from "@/types/unsplash";

/**
 * Memoiza búsquedas por texto exacto (normalizado) durante UNA generación de
 * itinerario. Guarda la Promise en curso, no solo el resultado, para que dos
 * actividades que buscan lo mismo en paralelo (Promise.all por día) tampoco
 * disparen dos llamadas a la API. Se crea una instancia nueva por llamada a
 * enrichItineraryWithImages — nunca se comparte entre usuarios/requests.
 */
export function createCachedSearch(): (query: string) => Promise<RankedPhoto[]> {
  const cache = new Map<string, Promise<RankedPhoto[]>>();

  return function cachedSearch(query: string): Promise<RankedPhoto[]> {
    const key = query.trim().toLowerCase();
    if (!key) return Promise.resolve([]);

    let pending = cache.get(key);
    if (!pending) {
      pending = searchPhotos(query);
      cache.set(key, pending);
    }
    return pending;
  };
}
