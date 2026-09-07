import type { GeminiTripInput, ItineraryInputDay } from "@/types/itinerary";

/**
 * Convierte los días guardados en json_data.input (formato del formulario,
 * "places") al formato que exige prompts/itinerary-generator.md, sección 3
 * ("days" con número de día explícito e "items").
 */
export function toGeminiTripInput(params: {
  passengerName: string;
  destination: string;
  startDate: string;
  endDate: string;
  days: ItineraryInputDay[];
}): GeminiTripInput {
  return {
    passengerName: params.passengerName,
    destination: params.destination,
    startDate: params.startDate,
    endDate: params.endDate,
    days: params.days.map((day, index) => ({
      day: index + 1,
      items: day.places.map(({ place, activity }) => ({ place, activity })),
    })),
  };
}
