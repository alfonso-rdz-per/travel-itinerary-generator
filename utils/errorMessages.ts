import { GeminiError, type GeminiErrorCode } from "@/services/gemini/errors";
import { UnsplashError, type UnsplashErrorCode } from "@/services/unsplash/errors";

const GEMINI_ERROR_MESSAGES: Record<GeminiErrorCode, string> = {
  config: "La integración con la IA no está configurada correctamente. Contacta al administrador.",
  auth: "La integración con la IA no está configurada correctamente. Contacta al administrador.",
  network: "No se pudo conectar con el servicio de IA. Verifica tu conexión e intenta de nuevo.",
  timeout: "La generación tardó demasiado en responder. Intenta de nuevo.",
  quota: "Se alcanzó el límite de uso de la IA por ahora. Intenta de nuevo en unos minutos.",
  "invalid-json": "La IA devolvió una respuesta inesperada. Intenta de nuevo.",
  "invalid-schema": "La IA devolvió una respuesta inesperada. Intenta de nuevo.",
  unknown: "No se pudo generar el itinerario. Intenta de nuevo.",
};

export function getGeminiErrorMessage(error: unknown): string {
  if (error instanceof GeminiError) return GEMINI_ERROR_MESSAGES[error.code];
  return GEMINI_ERROR_MESSAGES.unknown;
}

const UNSPLASH_ERROR_MESSAGES: Record<UnsplashErrorCode, string> = {
  config: "La búsqueda de imágenes no está configurada correctamente. Contacta al administrador.",
  auth: "La búsqueda de imágenes no está configurada correctamente. Contacta al administrador.",
  "rate-limit": "Se alcanzó el límite de búsquedas de Unsplash por ahora. Intenta de nuevo en unos minutos.",
  network: "No se pudo conectar con Unsplash. Verifica tu conexión e intenta de nuevo.",
  timeout: "Unsplash tardó demasiado en responder. Intenta de nuevo.",
  unknown: "No se pudo completar la operación con Unsplash. Intenta de nuevo.",
};

export function getUnsplashErrorMessage(error: unknown): string {
  if (error instanceof UnsplashError) return UNSPLASH_ERROR_MESSAGES[error.code];
  return UNSPLASH_ERROR_MESSAGES.unknown;
}
