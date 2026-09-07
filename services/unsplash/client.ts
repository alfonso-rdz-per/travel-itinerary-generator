import "server-only";
import { UnsplashError } from "./errors";

const API_BASE = "https://api.unsplash.com";
const TIMEOUT_MS = 10_000;

function getAccessKey(): string {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) {
    throw new UnsplashError("config", "Falta configurar UNSPLASH_ACCESS_KEY en el servidor.");
  }
  return key;
}

async function request(url: string | URL, accessKey: string): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    return await fetch(url, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        "Accept-Version": "v1",
      },
      signal: controller.signal,
    });
  } catch (cause) {
    if (cause instanceof Error && cause.name === "AbortError") {
      throw new UnsplashError("timeout", "Unsplash tardó demasiado en responder.", cause);
    }
    throw new UnsplashError("network", "No se pudo conectar con Unsplash.", cause);
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Unsplash señala tanto una clave inválida como el límite de solicitudes
 * excedido con HTTP 403 (no 429): la única forma de distinguirlos es mirar
 * el header X-Ratelimit-Remaining.
 */
function assertOk(response: Response): void {
  if (response.ok) return;

  if (response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0") {
    throw new UnsplashError("rate-limit", "Se alcanzó el límite de solicitudes de Unsplash.");
  }
  if (response.status === 401 || response.status === 403) {
    throw new UnsplashError("auth", "La clave de la API de Unsplash no es válida.");
  }
  throw new UnsplashError("unknown", `Unsplash respondió con un error (${response.status}).`);
}

export async function unsplashGet(path: string, searchParams: Record<string, string>): Promise<unknown> {
  const accessKey = getAccessKey();
  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(searchParams)) url.searchParams.set(key, value);

  const response = await request(url, accessKey);
  assertOk(response);
  return response.json();
}

/** Golpea una URL absoluta que Unsplash ya entregó (ej. links.download_location). */
export async function unsplashPing(url: string): Promise<void> {
  const accessKey = getAccessKey();
  const response = await request(url, accessKey);
  assertOk(response);
}
