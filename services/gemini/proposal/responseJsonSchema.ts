import { z } from "zod";
import { proposalAiResponseSchema } from "@/types/proposal";

/**
 * Deriva el JSON Schema estricto que se envía a OpenRouter como
 * `response_format.json_schema` a partir del mismo esquema de Zod que valida
 * la respuesta (types/proposal.ts) — nunca se duplica la definición.
 *
 * El post-procesado es el mismo que usa el generador de itinerarios
 * (services/gemini/responseJsonSchema.ts): quita palabras clave que el modo
 * estricto no soporta y fuerza `additionalProperties: false` + `required`
 * completo en cada objeto. Se mantiene una copia local pequeña y sin estado
 * para no modificar el archivo del generador de itinerarios.
 */
const UNSUPPORTED_SCHEMA_KEYWORDS = [
  "maxLength",
  "minLength",
  "maxItems",
  "minItems",
  "minimum",
  "maximum",
  "exclusiveMinimum",
  "exclusiveMaximum",
  "pattern",
  "format",
  "multipleOf",
  "default",
];

function stripUnsupportedKeywords(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(stripUnsupportedKeywords);
  if (node && typeof node === "object") {
    return Object.fromEntries(
      Object.entries(node)
        .filter(([key]) => !UNSUPPORTED_SCHEMA_KEYWORDS.includes(key))
        .map(([key, value]) => [key, stripUnsupportedKeywords(value)]),
    );
  }
  return node;
}

function enforceStrictObjects(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(enforceStrictObjects);
  if (!node || typeof node !== "object") return node;

  const obj = node as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = enforceStrictObjects(value);
  }

  if (result.properties && typeof result.properties === "object") {
    result.additionalProperties = false;
    result.required = Object.keys(result.properties as Record<string, unknown>);
  }

  return result;
}

function buildProposalResponseJsonSchema(): Record<string, unknown> {
  const schema = z.toJSONSchema(proposalAiResponseSchema) as Record<string, unknown>;
  delete schema.$schema;
  const stripped = stripUnsupportedKeywords(schema);
  return enforceStrictObjects(stripped) as Record<string, unknown>;
}

export const PROPOSAL_RESPONSE_JSON_SCHEMA = buildProposalResponseJsonSchema();
