import type { DefaultDayImage } from "@/types/itinerary";

/**
 * Imagen local de respaldo (PROJECT_SPEC sección 9) cuando ninguna búsqueda
 * en Unsplash arroja resultados. `public/branding/default-day.jpg` ya está
 * provisto y en uso desde la Fase 8 (ver public/branding/README.md).
 */
export function getDefaultDayImage(triedQueries: string[]): DefaultDayImage {
  return {
    source: "default",
    path: "/branding/default-day.jpg",
    triedQueries,
  };
}
