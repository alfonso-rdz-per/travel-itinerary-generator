import type { GeminiTripInput } from "@/types/itinerary";

/**
 * Combina el prompt maestro (leído tal cual desde el .md) con los datos del
 * viaje, agregados al final como bloque JSON. El contenido del .md nunca se
 * altera, solo se concatena.
 */
export function buildItineraryPrompt(masterPrompt: string, tripInput: GeminiTripInput): string {
  const tripDataBlock = JSON.stringify(tripInput, null, 2);

  return [
    masterPrompt.trimEnd(),
    "",
    "---",
    "",
    "Datos del viaje a procesar (JSON):",
    "",
    tripDataBlock,
  ].join("\n");
}
