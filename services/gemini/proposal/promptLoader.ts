import "server-only";
import { readFile } from "fs/promises";
import path from "path";
import { GeminiError } from "../errors";

const PROMPT_PATH = path.join(process.cwd(), "prompts", "proposal-generator.md");

/**
 * Lee prompts/proposal-generator.md del disco en cada llamada (sin cachear en
 * memoria), igual que el prompt maestro de itinerarios: cualquier edición del
 * archivo se usa de inmediato, sin rebuild. El código nunca modifica este .md.
 */
export async function loadProposalPrompt(): Promise<string> {
  let content: string;

  try {
    content = await readFile(PROMPT_PATH, "utf-8");
  } catch (cause) {
    throw new GeminiError(
      "config",
      "No se pudo cargar la plantilla de generación de propuestas.",
      cause,
    );
  }

  if (!content.trim()) {
    throw new GeminiError("config", "La plantilla de generación de propuestas está vacía.");
  }

  return content;
}
