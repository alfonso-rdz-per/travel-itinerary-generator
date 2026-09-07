import { z } from "zod";
import { geminiItineraryResponseSchema } from "@/types/itinerary";

// Palabras clave de tamaño (JSON Schema) que los "structured outputs" en
// modo estricto (OpenRouter / OpenAI) no soportan dentro de `json_schema`.
// `ITINERARY_LIMITS` (types/itinerary.ts) sigue protegiendo a
// Supabase/Editor/PDF exactamente igual: la respuesta del modelo se sigue
// validando con el mismo `geminiItineraryResponseSchema` completo (con
// límites) después de recibirla — ver validateResponse() en
// generateItinerary.ts. Lo único que cambia es que el modelo ya no ve estas
// restricciones como una guía proactiva al generar.
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

/**
 * El modo estricto de structured outputs exige que TODO objeto declare
 * `additionalProperties: false` y liste en `required` todas sus propiedades.
 * Lo forzamos aquí en cada nodo, sin depender de cómo lo emita Zod.
 */
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

/**
 * Se envía al modelo (vía OpenRouter) como `response_format.json_schema` para
 * forzar la forma exacta de la respuesta. Se deriva del mismo esquema de Zod
 * que valida la respuesta (types/itinerary.ts) para no duplicar la
 * definición en dos formatos.
 */
function buildItineraryResponseJsonSchema(): Record<string, unknown> {
  const schema = z.toJSONSchema(geminiItineraryResponseSchema) as Record<string, unknown>;
  delete schema.$schema;
  const stripped = stripUnsupportedKeywords(schema);
  return enforceStrictObjects(stripped) as Record<string, unknown>;
}

export const ITINERARY_RESPONSE_JSON_SCHEMA = buildItineraryResponseJsonSchema();
