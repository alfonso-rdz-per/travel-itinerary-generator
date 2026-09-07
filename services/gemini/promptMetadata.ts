import "server-only";
import { createHash } from "crypto";

const VERSION_PATTERN = /^Versión:\s*(.+)$/m;

/** Lee la línea "Versión: X" del encabezado de prompts/itinerary-generator.md. */
export function getPromptVersion(promptContent: string): string {
  const match = VERSION_PATTERN.exec(promptContent);
  return match ? match[1].trim() : "desconocida";
}

export function getPromptHash(promptContent: string): string {
  return createHash("sha256").update(promptContent, "utf-8").digest("hex");
}
