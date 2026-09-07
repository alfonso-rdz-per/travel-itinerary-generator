import { z } from "zod";
import { ITINERARY_LIMITS } from "@/types/itinerary";

// Mismos topes que types/itinerary.ts (respuesta de Gemini): lo que el
// agente captura aquí debe caber sin fricción en todo el flujo
// formulario → Gemini → editor → PDF. Ver el comentario de
// ITINERARY_LIMITS para la justificación de cada número.
const { shortText, activityInstruction, maxDays, maxActivitiesPerDay } = ITINERARY_LIMITS;
const OBSERVATIONS_MAX = 1000;
const MAX_FLIGHTS = 30;

// "Vuelos y horarios": datos que se muestran tal cual en el PDF. `date`/`time`
// son opcionales (a veces sólo se anota "llegar 3h antes"); `description` es
// lo único obligatorio. Las filas vacías se descartan en el cliente antes de
// validar, así que aquí `description` siempre debe venir con texto.
const flightEntrySchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, "Escribe el dato del vuelo o elimínalo.")
    .max(shortText, "Ese texto es demasiado largo."),
  date: z.string().optional().default(""),
  time: z.string().optional().default(""),
});

const dayEntrySchema = z.object({
  place: z.string().trim().min(1, "Escribe un lugar o elimínalo.").max(shortText, "Ese lugar es demasiado largo."),
  activity: z.string().trim().max(activityInstruction, "Esa actividad es demasiado larga.").optional().default(""),
});

// "Datos" manuales del día: título (etiqueta en negritas) + cuerpo. Las filas
// totalmente vacías se descartan en el cliente antes de validar.
const manualNoteEntrySchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Escribe un título o elimina el dato.")
    .max(ITINERARY_LIMITS.manualNoteTitle, "Ese título es demasiado largo."),
  body: z
    .string()
    .trim()
    .min(1, "Escribe la información o elimina el dato.")
    .max(ITINERARY_LIMITS.manualNoteBody, "Ese texto es demasiado largo."),
});

const daySchema = z.object({
  places: z
    .array(dayEntrySchema)
    .min(1, "Agrega al menos un lugar.")
    .max(maxActivitiesPerDay, `Un día no puede tener más de ${maxActivitiesPerDay} lugares.`),
  manualNotes: z
    .array(manualNoteEntrySchema)
    .max(ITINERARY_LIMITS.maxManualNotes, `Un día no puede tener más de ${ITINERARY_LIMITS.maxManualNotes} datos.`)
    .optional()
    .default([]),
});

export const itineraryFormSchema = z
  .object({
    passengerName: z.string().trim().min(1, "Ingresa el nombre del pasajero.").max(shortText, "Ese nombre es demasiado largo."),
    destination: z.string().trim().min(1, "Ingresa el destino principal.").max(shortText, "Ese destino es demasiado largo."),
    startDate: z.string().min(1, "Selecciona la fecha de inicio."),
    endDate: z.string().min(1, "Selecciona la fecha final."),
    observations: z.string().trim().max(OBSERVATIONS_MAX, "Las observaciones son demasiado largas.").optional(),
    flights: z
      .array(flightEntrySchema)
      .max(MAX_FLIGHTS, `No se pueden agregar más de ${MAX_FLIGHTS} datos de vuelos.`)
      .optional()
      .default([]),
    days: z
      .array(daySchema)
      .min(1, "Agrega al menos un día.")
      .max(maxDays, `Un itinerario no puede tener más de ${maxDays} días.`),
  })
  .refine((data) => !data.startDate || !data.endDate || data.endDate >= data.startDate, {
    message: "La fecha final debe ser igual o posterior a la fecha de inicio.",
    path: ["endDate"],
  });

export type ItineraryFormValues = z.infer<typeof itineraryFormSchema>;
