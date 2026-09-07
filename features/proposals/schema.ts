import { z } from "zod";
import { PROPOSAL_CURRENCIES, PROPOSAL_LIMITS } from "@/types/proposal";

/**
 * Validación del formulario de propuestas. Comparte la forma con
 * `proposalInputSchema` (types/proposal.ts) pero agrega los mínimos y los
 * mensajes en español que ve el agente. El cliente ya convierte los campos
 * numéricos (número de días/viajeros, precio) a `number | null` antes de
 * validar.
 */
const L = PROPOSAL_LIMITS;

const optionalText = (max: number, tooLong: string) =>
  z.string().trim().max(max, tooLong).optional().default("");

const serviceSchema = z.object({
  dayLabel: optionalText(L.shortText, "Ese texto es demasiado largo."),
  name: z
    .string()
    .trim()
    .min(1, "Escribe el nombre del servicio o elimínalo.")
    .max(L.mediumText, "Ese nombre es demasiado largo."),
  place: optionalText(L.shortText, "Ese lugar es demasiado largo."),
  price: z
    .number({ message: "El precio debe ser un número." })
    .min(0, "El precio no puede ser negativo.")
    .max(999_999_999, "Ese precio es demasiado alto.")
    .nullable()
    .default(null),
  notes: optionalText(L.serviceNote, "Esas observaciones son demasiado largas."),
});

export const proposalFormSchema = z
  .object({
    client: z.object({
      name: z
        .string()
        .trim()
        .min(1, "Ingresa el nombre del cliente.")
        .max(L.shortText, "Ese nombre es demasiado largo."),
      email: z
        .string()
        .trim()
        .max(L.shortText, "Ese correo es demasiado largo.")
        .refine((value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
          message: "Ese correo no parece válido.",
        })
        .optional()
        .default(""),
      phone: optionalText(L.shortText, "Ese teléfono es demasiado largo."),
    }),
    trip: z
      .object({
        destination: z
          .string()
          .trim()
          .min(1, "Ingresa el destino o destinos.")
          .max(L.shortText, "Ese destino es demasiado largo."),
        startDate: z.string().optional().default(""),
        endDate: z.string().optional().default(""),
        numDays: z.number().int().min(0).max(999).nullable().default(null),
        numTravelers: z.number().int().min(0).max(999).nullable().default(null),
        tripType: optionalText(L.shortText, "Ese texto es demasiado largo."),
      })
      .refine(
        (trip) => !trip.startDate || !trip.endDate || trip.endDate >= trip.startDate,
        { message: "La fecha de regreso debe ser igual o posterior a la de salida.", path: ["endDate"] },
      ),
    proposal: z.object({
      title: optionalText(L.shortText, "Ese título es demasiado largo."),
      introMessage: optionalText(L.longText, "Ese mensaje es demasiado largo."),
      included: z.array(z.string().trim().min(1).max(L.mediumText)).max(L.maxListItems).default([]),
      notIncluded: z.array(z.string().trim().min(1).max(L.mediumText)).max(L.maxListItems).default([]),
      notes: optionalText(L.longText, "Esas notas son demasiado largas."),
    }),
    currency: z.enum(PROPOSAL_CURRENCIES),
    services: z
      .array(serviceSchema)
      .min(1, "Agrega al menos un servicio o actividad.")
      .max(L.maxServices, `No se pueden agregar más de ${L.maxServices} servicios.`),
  });

export type ProposalFormValues = z.infer<typeof proposalFormSchema>;

/**
 * Mapa de errores por ruta con puntos ("client.name", "services", "trip.endDate"),
 * porque `z.flatten()` solo aplana el primer nivel. Se usa igual en el
 * formulario y en las Server Actions.
 */
export function fieldErrorsFromZod(error: z.ZodError): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.map((segment) => String(segment)).join(".") || "_form";
    (map[key] ??= []).push(issue.message);
  }
  return map;
}
