import "server-only";
import { getOpenRouterConfig, type OpenRouterConfig } from "../client";
import { getPromptHash, getPromptVersion } from "../promptMetadata";
import { GeminiError, type GeminiErrorCode } from "../errors";
import { loadProposalPrompt } from "./promptLoader";
import { buildProposalPrompt, toProposalAiInput } from "./buildProposalPrompt";
import { PROPOSAL_RESPONSE_JSON_SCHEMA } from "./responseJsonSchema";
import {
  proposalAiResponseSchema,
  type ProposalAiResponse,
  type ProposalGenerationMetadata,
  type ProposalInput,
} from "@/types/proposal";

const TIMEOUT_MS = 90_000;
const MAX_ATTEMPTS = 2;

const RETRY_INSTRUCTION =
  "\n\n---\n\nTu respuesta anterior no cumplió exactamente el formato JSON solicitado. " +
  "Corrige el resultado y responde únicamente con un JSON válido que siga exactamente " +
  "la estructura indicada, con el mismo número de elementos en \"services\", sin texto adicional.";

const NON_RETRYABLE_CODES: GeminiErrorCode[] = ["config", "auth", "quota"];

export type GeneratedProposalContent = ProposalAiResponse & {
  metadata: ProposalGenerationMetadata;
};

export async function generateProposalContent(input: ProposalInput): Promise<GeneratedProposalContent> {
  const config = getOpenRouterConfig();
  const masterPrompt = await loadProposalPrompt();
  const aiInput = toProposalAiInput(input);
  const basePrompt = buildProposalPrompt(masterPrompt, aiInput);
  const promptVersion = getPromptVersion(masterPrompt);
  const promptHash = getPromptHash(masterPrompt);
  const startedAt = Date.now();

  let lastError: GeminiError = new GeminiError("unknown", "No se pudo generar la propuesta.");

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const prompt = attempt === 1 ? basePrompt : basePrompt + RETRY_INSTRUCTION;

    try {
      const raw = await callModel(config, prompt);
      const parsed = parseJson(raw);
      const content = validateResponse(parsed, aiInput.services.length);

      return {
        ...content,
        metadata: {
          model: config.model,
          generatedAt: new Date().toISOString(),
          durationMs: Date.now() - startedAt,
          promptVersion,
          promptHash,
        },
      };
    } catch (error) {
      lastError = toGeminiError(error);
      const canRetry = attempt < MAX_ATTEMPTS && !NON_RETRYABLE_CODES.includes(lastError.code);
      if (!canRetry) throw lastError;
      console.error(
        `[proposal] intento ${attempt} falló (${lastError.code}), reintentando…`,
        lastError.cause ?? lastError,
      );
    }
  }

  throw lastError;
}

async function callModel(config: OpenRouterConfig, prompt: string): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://wander-travel.example.com",
        "X-Title": "Wander Travel",
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.6,
        messages: [{ role: "user", content: prompt }],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "propuesta",
            strict: true,
            schema: PROPOSAL_RESPONSE_JSON_SCHEMA,
          },
        },
      }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new GeminiError("timeout", "El servicio de IA tardó demasiado en responder.", error);
    }
    throw new GeminiError("network", "No se pudo conectar con el servicio de IA.", error);
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) throw await mapHttpError(response);

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    throw new GeminiError("invalid-json", "El servicio de IA devolvió una respuesta ilegible.", error);
  }

  const text = extractContent(payload);
  if (!text) {
    const embedded = (payload as { error?: { message?: string } })?.error?.message;
    throw new GeminiError(
      "unknown",
      embedded
        ? `El servicio de IA respondió con un error: ${embedded}`
        : "El servicio de IA no devolvió contenido.",
    );
  }
  return text;
}

function extractContent(payload: unknown): string | null {
  const content = (payload as { choices?: { message?: { content?: unknown } }[] })?.choices?.[0]?.message
    ?.content;

  if (typeof content === "string") return content.trim() || null;
  if (Array.isArray(content)) {
    const joined = content
      .map((part) =>
        part && typeof part === "object" && "text" in part
          ? String((part as { text: unknown }).text)
          : "",
      )
      .join("")
      .trim();
    return joined || null;
  }
  return null;
}

async function mapHttpError(response: Response): Promise<GeminiError> {
  let detail = "";
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    detail = body?.error?.message ? ` (${body.error.message})` : "";
  } catch {
    // sin cuerpo legible
  }

  if (response.status === 401 || response.status === 403) {
    return new GeminiError("auth", `La clave de OPENROUTER_API_KEY no es válida${detail}.`);
  }
  if (response.status === 402) {
    return new GeminiError("quota", `La cuenta de OpenRouter no tiene crédito suficiente${detail}.`);
  }
  if (response.status === 429) {
    return new GeminiError("quota", `Se alcanzó el límite de uso del servicio de IA${detail}.`);
  }
  return new GeminiError("unknown", `El servicio de IA respondió con un error ${response.status}${detail}.`);
}

function parseJson(raw: string): unknown {
  const cleaned = stripCodeFences(raw.trim());
  try {
    return JSON.parse(cleaned);
  } catch (cause) {
    throw new GeminiError("invalid-json", "La IA devolvió una respuesta que no es JSON válido.", cause);
  }
}

function stripCodeFences(text: string): string {
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(text);
  return fenced ? fenced[1] : text;
}

function validateResponse(data: unknown, expectedServiceCount: number): ProposalAiResponse {
  const result = proposalAiResponseSchema.safeParse(data);

  if (!result.success) {
    console.error("[proposal] la respuesta no cumple el esquema esperado", result.error.flatten());
    throw new GeminiError("invalid-schema", "La IA devolvió una respuesta con un formato inesperado.", result.error);
  }

  if (result.data.services.length !== expectedServiceCount) {
    console.error(
      `[proposal] la IA devolvió ${result.data.services.length} descripciones para ${expectedServiceCount} servicios`,
    );
    throw new GeminiError(
      "invalid-schema",
      "La IA devolvió una cantidad de descripciones que no coincide con los servicios.",
    );
  }

  return result.data;
}

function toGeminiError(error: unknown): GeminiError {
  return error instanceof GeminiError
    ? error
    : new GeminiError("unknown", "Ocurrió un error inesperado al generar la propuesta.", error);
}
