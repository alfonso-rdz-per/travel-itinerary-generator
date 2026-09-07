import { z } from "zod";

/**
 * Límites de tamaño (Fase 9A, prioridad 3 del audit). No son arbitrarios:
 * dejan margen holgado (~2x) sobre las extensiones que el propio prompt
 * maestro le pide a Gemini (`prompts/itinerary-generator.md`):
 *   - introducción del día: 40-80 palabras (sección 11)
 *   - descripción de actividad: 60-120 palabras (sección 12)
 *   - descripción general del viaje: 120-220 palabras (sección 6)
 *   - recomendaciones: 3-5 (sección 7); consejos: sin cantidad fija (sección 8)
 * El margen existe para no rechazar una respuesta válida de Gemini que se
 * pase un poco de la guía, y para que el Editor (donde el agente reescribe
 * libremente) siga siendo cómodo de usar — no para permitir texto sin límite
 * que dispare costos de IA descontrolados o desborde el layout del PDF
 * (`features/pdf/styles.ts` usa `wrap={false}` en varios bloques).
 * Los arrays (días, actividades por día, recomendaciones, consejos) tienen
 * el mismo techo tanto aquí como en `features/itinerary-form/schema.ts`,
 * para que un itinerario grande siga siendo válido en todo el flujo
 * formulario → Gemini → editor.
 */
export const ITINERARY_LIMITS = {
  shortText: 200, // títulos, "lugar", palabras clave de búsqueda de imagen
  activityInstruction: 300, // "actividad" capturada por el agente en el formulario
  activityDescription: 1500, // ~120 palabras de guía + margen amplio
  dayIntroduction: 800, // ~80 palabras de guía + margen amplio
  overviewDescription: 2500, // ~220 palabras de guía + margen amplio
  listItem: 400, // cada recomendación/consejo
  maxDays: 90, // viaje largo real (vuelta al mundo) sigue cabiendo
  maxActivitiesPerDay: 20,
  maxListItems: 10, // recomendaciones o consejos por día
  manualNoteTitle: 120, // "Datos" del agente: etiqueta en negritas (ej. "Vuelos")
  manualNoteBody: 1500, // cuerpo del dato del agente
  maxManualNotes: 15, // "Datos" manuales por día
} as const;

const { shortText, activityInstruction, activityDescription, dayIntroduction, overviewDescription, listItem, maxDays, maxActivitiesPerDay, maxListItems, manualNoteTitle, manualNoteBody, maxManualNotes } =
  ITINERARY_LIMITS;

/**
 * "Datos" manuales de un día: texto libre que agrega ÚNICAMENTE el agente
 * (formulario o editor). La IA nunca lo ve, redacta ni modifica — no forma
 * parte de `geminiItineraryResponseSchema` (contrato con la IA). Se muestra
 * en el PDF justo debajo del título del día, con la etiqueta en negritas.
 */
export const manualNoteSchema = z.object({
  title: z.string().max(manualNoteTitle),
  body: z.string().max(manualNoteBody),
});

export type ManualNote = z.infer<typeof manualNoteSchema>;

/**
 * Estructura exacta que exige prompts/itinerary-generator.md (secciones 10 y 17).
 * Este esquema es la única fuente de verdad: valida la respuesta de Gemini,
 * genera el response schema que se envía a la API, y su z.infer es el tipo
 * que consume el resto de la aplicación (editor, PDF, etc.).
 */
export const geminiActivitySchema = z.object({
  place: z.string().max(shortText),
  activity: z.string().max(activityInstruction),
  description: z.string().max(activityDescription),
  imageSearch: z.string().max(shortText),
});

export const geminiDaySchema = z.object({
  // .min(1), no .positive(): Zod traduce .positive() a `exclusiveMinimum` en
  // JSON Schema (z.toJSONSchema), una palabra clave que la API de Gemini
  // (responseJsonSchema en services/gemini/responseJsonSchema.ts) rechaza
  // con "Request contains an invalid argument." — descubierto probando el
  // flujo real de generación en la Fase 10. `minimum` sí es compatible.
  day: z.number().int().min(1),
  title: z.string().max(shortText),
  introduction: z.string().max(dayIntroduction),
  activities: z.array(geminiActivitySchema).max(maxActivitiesPerDay),
  recommendations: z.array(z.string().max(listItem)).max(maxListItems),
  tips: z.array(z.string().max(listItem)).max(maxListItems),
});

export const geminiOverviewSchema = z.object({
  title: z.string().max(shortText),
  description: z.string().max(overviewDescription),
});

export const geminiItineraryResponseSchema = z.object({
  overview: geminiOverviewSchema,
  days: z.array(geminiDaySchema).max(maxDays),
});

export type GeminiActivity = z.infer<typeof geminiActivitySchema>;
export type GeminiDay = z.infer<typeof geminiDaySchema>;
export type GeminiOverview = z.infer<typeof geminiOverviewSchema>;
export type GeminiItineraryResponse = z.infer<typeof geminiItineraryResponseSchema>;

/**
 * Contenido que guarda el EDITOR (features/editor). Es la forma de la
 * respuesta de la IA + los "Datos" manuales por día (que la IA nunca produce).
 * `updateItineraryContent` valida contra este esquema, no contra
 * `geminiItineraryResponseSchema`, para no descartar `manualNotes`.
 */
export const editorDaySchema = geminiDaySchema.extend({
  manualNotes: z.array(manualNoteSchema).max(maxManualNotes).default([]),
});

export const editorItineraryContentSchema = z.object({
  overview: geminiOverviewSchema,
  days: z.array(editorDaySchema).max(maxDays),
});

export type EditorItineraryContent = z.infer<typeof editorItineraryContentSchema>;

/**
 * Datos del viaje tal como los espera prompts/itinerary-generator.md (sección 3).
 */
export const geminiTripInputItemSchema = z.object({
  place: z.string().max(shortText),
  activity: z.string().max(activityInstruction),
});

export const geminiTripInputDaySchema = z.object({
  // .min(1), no .positive(): Zod traduce .positive() a `exclusiveMinimum` en
  // JSON Schema (z.toJSONSchema), una palabra clave que la API de Gemini
  // (responseJsonSchema en services/gemini/responseJsonSchema.ts) rechaza
  // con "Request contains an invalid argument." — descubierto probando el
  // flujo real de generación en la Fase 10. `minimum` sí es compatible.
  day: z.number().int().min(1),
  items: z.array(geminiTripInputItemSchema).max(maxActivitiesPerDay),
});

export const geminiTripInputSchema = z.object({
  passengerName: z.string().max(shortText),
  destination: z.string().max(shortText),
  startDate: z.string(),
  endDate: z.string(),
  days: z.array(geminiTripInputDaySchema).max(maxDays),
});

export type GeminiTripInput = z.infer<typeof geminiTripInputSchema>;

/**
 * Metadata de la generación, calculada por la app (no validada con Zod:
 * no proviene de la respuesta de Gemini, la produce services/gemini).
 */
export type GeminiGenerationMetadata = {
  model: string;
  generatedAt: string;
  durationMs: number;
  promptVersion: string;
  promptHash: string;
};

export type GeneratedItinerary = GeminiItineraryResponse & { metadata: GeminiGenerationMetadata };

/**
 * Imagen principal de un día, elegida por services/unsplash entre las fotos
 * encontradas para las actividades de ese día (ver enrichItinerary.ts).
 * No proviene de Gemini ni se valida con Zod.
 */
export type UnsplashDayImage = {
  source: "unsplash";
  id: string;
  imageSearch: string;
  photographer: string;
  photographerUrl: string;
  unsplashUrl: string;
  downloadLocation: string;
  width: number;
  height: number;
  color: string | null;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
};

/** Imagen local de respaldo cuando ninguna búsqueda en Unsplash arroja resultados. */
export type DefaultDayImage = {
  source: "default";
  path: string;
  triedQueries: string[];
};

/**
 * El agente eliminó explícitamente la imagen de este día desde el editor
 * (Fase 10). Distinto de `DefaultDayImage`: ese representa "no se encontró
 * nada automáticamente" y el PDF sí debe mostrar `default-day.jpg`; este
 * representa una decisión deliberada del agente y el PDF NUNCA debe mostrar
 * ninguna imagen para ese día (ver features/pdf/generatePdf.tsx).
 */
export type RemovedDayImage = { source: "none" };

export type ItineraryDayImage = UnsplashDayImage | DefaultDayImage | RemovedDayImage;

export type EnrichedDay = GeminiDay & { image: ItineraryDayImage; manualNotes?: ManualNote[] };

export type EnrichedItinerary = Omit<GeneratedItinerary, "days"> & { days: EnrichedDay[] };

export type ItineraryInputDay = {
  places: { place: string; activity: string }[];
  /** "Datos" manuales del agente para este día (texto libre, la IA no los toca). */
  manualNotes?: ManualNote[];
};

/**
 * Dato de vuelo / horario capturado por el agente en el formulario. Se guarda
 * en `json_data.input.flights` y se muestra TAL CUAL en el PDF (bloque propio,
 * "Vuelos y horarios"): la IA nunca lo reescribe ni lo recibe como contexto.
 * `date` es "YYYY-MM-DD" (input date) y `time` es "HH:MM" (input time).
 */
export type ItineraryFlight = { description: string; date?: string; time?: string };

export type ItineraryJsonData = {
  input: { days: ItineraryInputDay[]; flights?: ItineraryFlight[] };
  generated?: EnrichedItinerary;
};
