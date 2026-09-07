import "server-only";
import { createCachedSearch } from "./cachedSearch";
import { selectBestPhoto } from "./selectBestPhoto";
import { buildDayImage } from "./attribution";
import { triggerDownload } from "./downloadTracking";
import { getDefaultDayImage } from "./defaultImage";
import { UnsplashError } from "./errors";
import type { RankedPhoto, SourcedPhoto } from "@/types/unsplash";
import type {
  GeminiActivity,
  GeminiDay,
  GeneratedItinerary,
  EnrichedDay,
  EnrichedItinerary,
  ItineraryDayImage,
} from "@/types/itinerary";

type SearchFn = (query: string) => Promise<RankedPhoto[]>;
type ErrorTracker = (error: unknown) => void;

// Un itinerario grande (muchos días × muchas actividades) no debe disparar
// decenas de solicitudes simultáneas a Unsplash — quema su rate limit y
// degrada la calidad de las imágenes elegidas por saturación, no por falta
// de resultados reales. Sin librería nueva: un límite simple de trabajadores
// concurrentes es suficiente para este caso.
const DAY_CONCURRENCY = 4;
const ACTIVITY_CONCURRENCY = 4;

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++;
      results[currentIndex] = await fn(items[currentIndex]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

export type EnrichImagesResult = {
  itinerary: EnrichedItinerary;
  /** true si Unsplash falló de forma sistémica (config/auth/red/cuota), no solo "sin resultados". */
  imagesIncomplete: boolean;
};

/**
 * Adjunta a cada día su imagen principal, buscando en Unsplash únicamente
 * con los `imageSearch` que Gemini ya generó. Nunca lanza: si Unsplash falla
 * por completo, cada día recibe la imagen local de respaldo y se conserva
 * igualmente el itinerario generado por Gemini.
 */
export async function enrichItineraryWithImages(
  itinerary: GeneratedItinerary,
  destination: string,
): Promise<EnrichImagesResult> {
  if (!process.env.UNSPLASH_ACCESS_KEY) {
    console.error(
      "[unsplash] UNSPLASH_ACCESS_KEY no está configurada; se usará la imagen predeterminada en todos los días.",
    );
    const days = itinerary.days.map((day) => ({ ...day, image: getDefaultDayImage([]) }));
    return { itinerary: { ...itinerary, days }, imagesIncomplete: true };
  }

  const search = createCachedSearch();
  let hadSystemicError = false;

  const trackError: ErrorTracker = (error) => {
    if (error instanceof UnsplashError && error.code !== "unknown") hadSystemicError = true;
    console.error("[unsplash] error durante la búsqueda de imágenes", error);
  };

  const days = await mapWithConcurrency(itinerary.days, DAY_CONCURRENCY, (day) =>
    resolveDayImage(day, destination, search, trackError),
  );

  return { itinerary: { ...itinerary, days }, imagesIncomplete: hadSystemicError };
}

async function resolveDayImage(
  day: GeminiDay,
  destination: string,
  search: SearchFn,
  trackError: ErrorTracker,
): Promise<EnrichedDay> {
  const triedQueries: string[] = [];

  let candidates = await collectActivityCandidates(day, search, trackError, triedQueries);

  if (candidates.length === 0) {
    triedQueries.push(destination);
    try {
      const bySourceQuery = await search(destination);
      candidates = bySourceQuery.map((c) => ({ ...c, query: destination }));
    } catch (error) {
      trackError(error);
    }
  }

  const best = selectBestPhoto(candidates);

  const image: ItineraryDayImage = best
    ? buildDayImage(best.photo, best.query)
    : getDefaultDayImage(triedQueries);

  if (best) await triggerDownload(best.photo);

  return { ...day, image };
}

async function collectActivityCandidates(
  day: GeminiDay,
  search: SearchFn,
  trackError: ErrorTracker,
  triedQueries: string[],
): Promise<SourcedPhoto[]> {
  const perActivity = await mapWithConcurrency(day.activities, ACTIVITY_CONCURRENCY, (activity) =>
    searchForActivity(activity, search, trackError, triedQueries),
  );
  return perActivity.flat();
}

/** Búsqueda exacta con imageSearch (única fuente); si no hay resultados, un único intento con el `place` real de la actividad. */
async function searchForActivity(
  activity: GeminiActivity,
  search: SearchFn,
  trackError: ErrorTracker,
  triedQueries: string[],
): Promise<SourcedPhoto[]> {
  triedQueries.push(activity.imageSearch);
  try {
    const primary = await search(activity.imageSearch);
    if (primary.length > 0) return primary.map((c) => ({ ...c, query: activity.imageSearch }));
  } catch (error) {
    trackError(error);
  }

  const alternative = activity.place.trim();
  const isSameQuery = alternative.toLowerCase() === activity.imageSearch.trim().toLowerCase();
  if (!alternative || isSameQuery) return [];

  triedQueries.push(alternative);
  try {
    const fallback = await search(alternative);
    return fallback.map((c) => ({ ...c, query: alternative }));
  } catch (error) {
    trackError(error);
    return [];
  }
}
