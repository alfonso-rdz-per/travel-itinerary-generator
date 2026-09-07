import { z } from "zod";

/**
 * Generador de Propuestas de Viaje.
 *
 * Este archivo es la única fuente de verdad de:
 *  - la forma del input que captura el agente (formulario),
 *  - la forma exacta de la respuesta de la IA (se valida y se deriva el JSON
 *    Schema estricto que se envía a OpenRouter),
 *  - la forma de `proposals.json_data`.
 *
 * REGLA DE PRECIOS: el precio de cada servicio es un dato COMERCIAL del
 * agente. Vive únicamente en `ProposalServiceInput.price` (número). La IA
 * nunca lo recibe, nunca lo devuelve y nunca participa en el total — el total
 * se calcula en código (features/proposals/money.ts).
 */

export const PROPOSAL_CURRENCIES = ["MXN", "USD", "EUR"] as const;
export type ProposalCurrency = (typeof PROPOSAL_CURRENCIES)[number];

export const PROPOSAL_LIMITS = {
  shortText: 200,
  mediumText: 400,
  longText: 2000, // notas, mensaje personalizado del agente
  serviceNote: 500,
  aiPresentation: 1200, // ~2x la guía del prompt (margen de seguridad, no el objetivo)
  aiTripOverview: 900,
  aiServiceDescription: 700, // 1-2 frases + margen
  aiClosing: 900,
  maxServices: 60,
  maxListItems: 40, // "incluye" / "no incluye"
} as const;

const L = PROPOSAL_LIMITS;

/* -------------------------------------------------------------------------- */
/* Input del agente (formulario → json_data.input)                            */
/* -------------------------------------------------------------------------- */

export const proposalClientSchema = z.object({
  name: z.string().max(L.shortText),
  email: z.string().max(L.shortText),
  phone: z.string().max(L.shortText),
});

export const proposalTripSchema = z.object({
  destination: z.string().max(L.shortText),
  startDate: z.string(), // "YYYY-MM-DD" o ""
  endDate: z.string(),
  numDays: z.number().int().min(0).nullable(),
  numTravelers: z.number().int().min(0).nullable(),
  tripType: z.string().max(L.shortText),
});

export const proposalInfoSchema = z.object({
  title: z.string().max(L.shortText),
  introMessage: z.string().max(L.longText),
  included: z.array(z.string().max(L.mediumText)).max(L.maxListItems),
  notIncluded: z.array(z.string().max(L.mediumText)).max(L.maxListItems),
  notes: z.string().max(L.longText),
});

/**
 * Un servicio / actividad capturado por el agente. `price` es el precio
 * comercial exacto (número, en la moneda de la propuesta). `null` = servicio
 * sin costo asignado (no suma al total).
 */
export const proposalServiceInputSchema = z.object({
  dayLabel: z.string().max(L.shortText), // "Día 1", "12 de marzo", libre
  name: z.string().max(L.mediumText),
  place: z.string().max(L.shortText),
  price: z.number().min(0).nullable(),
  notes: z.string().max(L.serviceNote),
});

export const proposalInputSchema = z.object({
  client: proposalClientSchema,
  trip: proposalTripSchema,
  proposal: proposalInfoSchema,
  currency: z.enum(PROPOSAL_CURRENCIES),
  services: z.array(proposalServiceInputSchema).max(L.maxServices),
});

export type ProposalClientInput = z.infer<typeof proposalClientSchema>;
export type ProposalTripInput = z.infer<typeof proposalTripSchema>;
export type ProposalInfoInput = z.infer<typeof proposalInfoSchema>;
export type ProposalServiceInput = z.infer<typeof proposalServiceInputSchema>;
export type ProposalInput = z.infer<typeof proposalInputSchema>;

/* -------------------------------------------------------------------------- */
/* Respuesta de la IA (json_data.generated)                                   */
/* -------------------------------------------------------------------------- */

/**
 * Estructura EXACTA que exige prompts/proposal-generator.md. La IA redacta
 * texto; no devuelve precios, ni fechas, ni nombres de hoteles/vuelos, ni
 * ningún dato que el agente no haya proporcionado.
 *
 * `services` debe tener la misma longitud y orden que `input.services`: cada
 * entrada es solo la descripción breve redactada para ese servicio.
 */
export const proposalGeneratedServiceSchema = z.object({
  description: z.string().max(L.aiServiceDescription),
});

export const proposalAiResponseSchema = z.object({
  presentation: z.string().max(L.aiPresentation),
  tripOverview: z.string().max(L.aiTripOverview),
  services: z.array(proposalGeneratedServiceSchema).max(L.maxServices),
  closing: z.string().max(L.aiClosing),
});

export type ProposalAiResponse = z.infer<typeof proposalAiResponseSchema>;

export type ProposalGenerationMetadata = {
  model: string;
  generatedAt: string;
  durationMs: number;
  promptVersion: string;
  promptHash: string;
};

/* -------------------------------------------------------------------------- */
/* Imagen del destino (Unsplash) — misma forma que la de itinerarios          */
/* -------------------------------------------------------------------------- */

export type ProposalUnsplashImage = {
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
  urls: { raw: string; full: string; regular: string; small: string; thumb: string };
};

/** No se encontró / no se buscó imagen: la propuesta se muestra sin foto de destino. */
export type ProposalNoImage = { source: "none" };

export type ProposalImage = ProposalUnsplashImage | ProposalNoImage;

/* -------------------------------------------------------------------------- */
/* json_data completo                                                         */
/* -------------------------------------------------------------------------- */

export type ProposalGenerated = ProposalAiResponse & {
  image: ProposalImage;
  metadata: ProposalGenerationMetadata;
};

export type ProposalJsonData = {
  input: ProposalInput;
  generated?: ProposalGenerated;
};
