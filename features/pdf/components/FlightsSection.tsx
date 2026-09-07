import { View, Text } from "@react-pdf/renderer";
import type { ItineraryFlight } from "@/types/itinerary";
import { styles } from "../styles";
import { formatCalendarDate } from "@/utils/formatDate";

function formatWhen(flight: ItineraryFlight): string | null {
  const parts: string[] = [];
  if (flight.date) parts.push(formatCalendarDate(flight.date));
  if (flight.time) parts.push(flight.time);
  return parts.length > 0 ? parts.join(" · ") : null;
}

/**
 * Bloque "Vuelos y horarios": se muestra TAL CUAL lo capturó el agente en el
 * formulario (json_data.input.flights). La IA no interviene en este contenido.
 * Sólo se renderiza si hay al menos un dato.
 */
export function FlightsSection({ flights }: { flights: ItineraryFlight[] }) {
  if (flights.length === 0) return null;

  return (
    <View style={styles.flightsSection} wrap={false}>
      <Text style={styles.sectionLabel}>Vuelos y horarios</Text>
      {flights.map((flight, index) => {
        const when = formatWhen(flight);
        return (
          <View
            key={index}
            style={index === flights.length - 1 ? styles.flightRowLast : styles.flightRow}
          >
            <Text style={styles.flightDescription}>• {flight.description}</Text>
            {when && <Text style={styles.flightWhen}>{when}</Text>}
          </View>
        );
      })}
    </View>
  );
}
