import "server-only";
import { readFile } from "fs/promises";
import path from "path";
import { GeminiError } from "./errors";

const PROMPT_PATH = path.join(process.cwd(), "prompts", "itinerary-generator.md");

/**
 * Lee prompts/itinerary-generator.md del disco en cada llamada (sin cachear en
 * memoria) para que cualquier edición del archivo se use de inmediato, sin
 * requerir un nuevo build. Ese archivo nunca se modifica desde el código.
 */
export async function loadMasterPrompt(): Promise<string> {
  let content: string;

  try {
    content = await readFile(PROMPT_PATH, "utf-8");
  } catch (cause) {
    throw new GeminiError(
      "config",
      "No se pudo cargar la plantilla de generación de itinerarios.",
      cause,
    );
  }

  if (!content.trim()) {
    throw new GeminiError("config", "La plantilla de generación de itinerarios está vacía.");
  }

  return content;
}
