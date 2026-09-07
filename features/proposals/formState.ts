import type { ProposalCurrency, ProposalInput } from "@/types/proposal";
import type { ProposalFormValues } from "./schema";

export type ServiceRow = {
  id: string;
  dayLabel: string;
  name: string;
  place: string;
  price: string;
  notes: string;
};

export type ProposalFormState = {
  client: { name: string; email: string; phone: string };
  trip: {
    destination: string;
    startDate: string;
    endDate: string;
    numDays: string;
    numTravelers: string;
    tripType: string;
  };
  proposal: {
    title: string;
    introMessage: string;
    includedText: string;
    notIncludedText: string;
    notes: string;
  };
  currency: ProposalCurrency;
  services: ServiceRow[];
};

export function createServiceRow(partial?: Partial<Omit<ServiceRow, "id">>): ServiceRow {
  return {
    id: crypto.randomUUID(),
    dayLabel: partial?.dayLabel ?? "",
    name: partial?.name ?? "",
    place: partial?.place ?? "",
    price: partial?.price ?? "",
    notes: partial?.notes ?? "",
  };
}

export function emptyProposalFormState(): ProposalFormState {
  return {
    client: { name: "", email: "", phone: "" },
    trip: { destination: "", startDate: "", endDate: "", numDays: "", numTravelers: "", tripType: "" },
    proposal: { title: "", introMessage: "", includedText: "", notIncludedText: "", notes: "" },
    currency: "MXN",
    services: [createServiceRow()],
  };
}

/** Reconstruye el estado del formulario a partir del `input` guardado (edición). */
export function proposalInputToFormState(input: ProposalInput): ProposalFormState {
  return {
    client: {
      name: input.client.name,
      email: input.client.email,
      phone: input.client.phone,
    },
    trip: {
      destination: input.trip.destination,
      startDate: input.trip.startDate,
      endDate: input.trip.endDate,
      numDays: input.trip.numDays !== null ? String(input.trip.numDays) : "",
      numTravelers: input.trip.numTravelers !== null ? String(input.trip.numTravelers) : "",
      tripType: input.trip.tripType,
    },
    proposal: {
      title: input.proposal.title,
      introMessage: input.proposal.introMessage,
      includedText: input.proposal.included.join("\n"),
      notIncludedText: input.proposal.notIncluded.join("\n"),
      notes: input.proposal.notes,
    },
    currency: input.currency,
    services:
      input.services.length > 0
        ? input.services.map((service) =>
            createServiceRow({
              dayLabel: service.dayLabel,
              name: service.name,
              place: service.place,
              price: service.price !== null ? String(service.price) : "",
              notes: service.notes,
            }),
          )
        : [createServiceRow()],
  };
}

function parseIntOrNull(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parsed = Number.parseInt(trimmed, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

/** "$1,850 MXN" / "1850" / "" → 1850 | null. Nunca lanza. */
export function parsePrice(raw: string): number | null {
  const cleaned = raw.replace(/[^0-9.]/g, "");
  if (!cleaned) return null;
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function splitLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** Estado del formulario → payload que validan Zod y las Server Actions. */
export function formStateToValues(state: ProposalFormState): ProposalFormValues {
  return {
    client: {
      name: state.client.name.trim(),
      email: state.client.email.trim(),
      phone: state.client.phone.trim(),
    },
    trip: {
      destination: state.trip.destination.trim(),
      startDate: state.trip.startDate,
      endDate: state.trip.endDate,
      numDays: parseIntOrNull(state.trip.numDays),
      numTravelers: parseIntOrNull(state.trip.numTravelers),
      tripType: state.trip.tripType.trim(),
    },
    proposal: {
      title: state.proposal.title.trim(),
      introMessage: state.proposal.introMessage.trim(),
      included: splitLines(state.proposal.includedText),
      notIncluded: splitLines(state.proposal.notIncludedText),
      notes: state.proposal.notes.trim(),
    },
    currency: state.currency,
    services: state.services
      .map((service) => ({
        dayLabel: service.dayLabel.trim(),
        name: service.name.trim(),
        place: service.place.trim(),
        price: parsePrice(service.price),
        notes: service.notes.trim(),
      }))
      // Filas totalmente vacías se descartan (el agente las agregó y no llenó).
      .filter(
        (service) =>
          service.name.length > 0 ||
          service.place.length > 0 ||
          service.dayLabel.length > 0 ||
          service.notes.length > 0 ||
          service.price !== null,
      ),
  };
}
