import { formatCalendarDate, formatDateRange } from "@/utils/formatDate";
import type { ProposalGenerated, ProposalInput } from "@/types/proposal";
import { formatMoney, proposalTotal } from "./money";

/**
 * "Vista" común que consumen tanto la previsualización HTML como el PDF, para
 * que ambos muestren exactamente lo mismo. Todo cálculo numérico (total,
 * duración) ocurre aquí, en código — nunca en la IA.
 */
export type ProposalView = {
  documentTitle: string;
  clientName: string;
  destination: string;
  dateLabel: string | null;
  durationLabel: string | null;
  travelersLabel: string | null;
  tripTypeLabel: string | null;
  tripFacts: { label: string; value: string }[];
  services: {
    dayLabel: string;
    name: string;
    place: string;
    priceLabel: string | null;
    description: string;
    note: string;
  }[];
  total: number;
  totalLabel: string;
  currency: string;
  included: string[];
  notIncluded: string[];
  notes: string;
  presentation: string;
  tripOverview: string;
  closing: string;
};

function diffInDays(startIso: string, endIso: string): number | null {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const ms = end.getTime() - start.getTime();
  if (ms < 0) return null;
  return Math.round(ms / 86_400_000) + 1; // inclusivo
}

function buildDateLabel(startDate: string, endDate: string): string | null {
  if (startDate && endDate) return formatDateRange(startDate, endDate);
  if (startDate) return formatCalendarDate(startDate);
  if (endDate) return formatCalendarDate(endDate);
  return null;
}

export function buildProposalView(
  input: ProposalInput,
  generated: ProposalGenerated | null,
): ProposalView {
  const { trip, proposal, currency, services } = input;

  const dateLabel = buildDateLabel(trip.startDate, trip.endDate);

  const computedDays =
    trip.numDays && trip.numDays > 0
      ? trip.numDays
      : trip.startDate && trip.endDate
        ? diffInDays(trip.startDate, trip.endDate)
        : null;
  const durationLabel = computedDays ? `${computedDays} ${computedDays === 1 ? "día" : "días"}` : null;

  const travelersLabel =
    trip.numTravelers && trip.numTravelers > 0
      ? `${trip.numTravelers} ${trip.numTravelers === 1 ? "viajero" : "viajeros"}`
      : null;

  const tripTypeLabel = trip.tripType.trim() || null;

  const tripFacts: { label: string; value: string }[] = [
    { label: "Destino", value: trip.destination },
  ];
  if (durationLabel) tripFacts.push({ label: "Duración", value: durationLabel });
  if (dateLabel) tripFacts.push({ label: "Fechas", value: dateLabel });
  if (travelersLabel) tripFacts.push({ label: "Viajeros", value: travelersLabel });
  if (tripTypeLabel) tripFacts.push({ label: "Motivo del viaje", value: tripTypeLabel });

  const total = proposalTotal(services);

  return {
    documentTitle: proposal.title.trim() || `Propuesta de viaje · ${trip.destination}`,
    clientName: input.client.name,
    destination: trip.destination,
    dateLabel,
    durationLabel,
    travelersLabel,
    tripTypeLabel,
    tripFacts,
    services: services.map((service, index) => ({
      dayLabel: service.dayLabel,
      name: service.name,
      place: service.place,
      priceLabel: service.price !== null ? formatMoney(service.price, currency) : null,
      description: generated?.services[index]?.description ?? "",
      note: service.notes,
    })),
    total,
    totalLabel: formatMoney(total, currency),
    currency,
    included: proposal.included,
    notIncluded: proposal.notIncluded,
    notes: proposal.notes,
    presentation: generated?.presentation ?? "",
    tripOverview: generated?.tripOverview ?? "",
    closing: generated?.closing ?? "",
  };
}
