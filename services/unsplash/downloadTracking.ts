import "server-only";
import { unsplashPing } from "./client";
import type { UnsplashPhoto } from "@/types/unsplash";

/**
 * Política de Unsplash: cada vez que una foto queda efectivamente "usada"
 * (aquí: asignada como imagen de un día) se debe notificar su
 * links.download_location. Es un requisito de cumplimiento para producción,
 * no debe romper la generación del itinerario si falla.
 */
export async function triggerDownload(photo: UnsplashPhoto): Promise<void> {
  try {
    await unsplashPing(photo.links.download_location);
  } catch (error) {
    console.error("[unsplash] no se pudo registrar el uso de la foto", photo.id, error);
  }
}
