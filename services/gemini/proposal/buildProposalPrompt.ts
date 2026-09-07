import type { ProposalInput } from "@/types/proposal";

/**
 * Payload que SÍ se le envía a la IA. Deliberadamente NO incluye:
 *   - precios de los servicios (dato comercial; la IA nunca debe verlos)
 *   - correo ni teléfono del cliente (solo contacto, no se redacta)
 *   - la moneda (irrelevante para redactar)
 */
export type ProposalAiInput = {
  client: { name: string };
  trip: {
    destination: string;
    startDate: string;
    endDate: string;
    numDays: number | null;
    numTravelers: number | null;
    tripType: string;
  };
  proposal: {
    title: string;
    personalMessage: string;
    included: string[];
    notIncluded: string[];
    notes: string;
  };
  services: { dayLabel: string; name: string; place: string; notes: string }[];
};

export function toProposalAiInput(input: ProposalInput): ProposalAiInput {
  return {
    client: { name: input.client.name },
    trip: {
      destination: input.trip.destination,
      startDate: input.trip.startDate,
      endDate: input.trip.endDate,
      numDays: input.trip.numDays,
      numTravelers: input.trip.numTravelers,
      tripType: input.trip.tripType,
    },
    proposal: {
      title: input.proposal.title,
      personalMessage: input.proposal.introMessage,
      included: input.proposal.included,
      notIncluded: input.proposal.notIncluded,
      notes: input.proposal.notes,
    },
    services: input.services.map((service) => ({
      dayLabel: service.dayLabel,
      name: service.name,
      place: service.place,
      notes: service.notes,
    })),
  };
}

/**
 * Combina el prompt maestro (leído tal cual del .md) con la información de la
 * propuesta, agregada al final como bloque JSON. El contenido del .md nunca se
 * altera, solo se concatena — mismo criterio que buildItineraryPrompt.
 */
export function buildProposalPrompt(masterPrompt: string, aiInput: ProposalAiInput): string {
  return [
    masterPrompt.trimEnd(),
    "",
    "---",
    "",
    "Información de la propuesta a redactar (JSON). El arreglo \"services\" de tu",
    "respuesta debe tener exactamente " + aiInput.services.length + " elemento(s), en este mismo orden:",
    "",
    JSON.stringify(aiInput, null, 2),
  ].join("\n");
}
