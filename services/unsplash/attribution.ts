import "server-only";
import type { UnsplashDayImage } from "@/types/itinerary";
import type { UnsplashPhoto } from "@/types/unsplash";

/**
 * Nombre de la aplicación registrada en Unsplash. Requerido por sus políticas
 * de atribución (utm_source) y para poder solicitar acceso a producción.
 * Configurable por variable de entorno para no requerir cambios de código
 * cuando se confirme el nombre exacto registrado en el dashboard de Unsplash.
 */
const APP_NAME = process.env.UNSPLASH_APP_NAME || "wander-travel";

function withAttributionParams(url: string): string {
  const withParams = new URL(url);
  withParams.searchParams.set("utm_source", APP_NAME);
  withParams.searchParams.set("utm_medium", "referral");
  return withParams.toString();
}

/** Construye la imagen del día a partir de la foto elegida, lista para guardarse en json_data. */
export function buildDayImage(photo: UnsplashPhoto, imageSearch: string): UnsplashDayImage {
  return {
    source: "unsplash",
    id: photo.id,
    imageSearch,
    photographer: photo.user.name,
    photographerUrl: withAttributionParams(photo.user.links.html),
    unsplashUrl: withAttributionParams(photo.links.html),
    downloadLocation: photo.links.download_location,
    width: photo.width,
    height: photo.height,
    color: photo.color,
    urls: photo.urls,
  };
}
