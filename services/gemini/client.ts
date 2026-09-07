import "server-only";
import { GeminiError } from "./errors";

/**
 * Configuración del proveedor de IA. La generación de itinerarios se hace
 * ahora contra OpenRouter (API compatible con el formato de OpenAI Chat
 * Completions), no contra la API directa de Google. El nombre de la carpeta
 * (`services/gemini`) y de los tipos se conserva por compatibilidad interna;
 * el modelo por defecto sigue siendo Gemini, sólo que enrutado por OpenRouter.
 *
 * Variables de entorno (sólo servidor):
 *   OPENROUTER_API_KEY   (obligatoria)  clave de https://openrouter.ai/keys
 *   OPENROUTER_MODEL     (opcional)     ej. "google/gemini-2.5-flash"
 *   OPENROUTER_BASE_URL  (opcional)     por defecto https://openrouter.ai/api/v1
 */

export const DEFAULT_MODEL = "google/gemini-2.5-flash";

export type OpenRouterConfig = {
  apiKey: string;
  model: string;
  baseUrl: string;
};

export function getOpenRouterConfig(): OpenRouterConfig {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    throw new GeminiError("config", "Falta configurar OPENROUTER_API_KEY en el servidor.");
  }

  return {
    apiKey,
    model: process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL,
    baseUrl: process.env.OPENROUTER_BASE_URL?.trim().replace(/\/+$/, "") || "https://openrouter.ai/api/v1",
  };
}
