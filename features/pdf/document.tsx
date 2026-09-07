import { Document, Page, Image, Text } from "@react-pdf/renderer";
import { styles } from "./styles";
import { PDF_THEME } from "./theme";
import type { ItineraryFlight } from "@/types/itinerary";
import { CoverPage } from "./components/CoverPage";
import { SummarySection } from "./components/SummarySection";
import { FlightsSection } from "./components/FlightsSection";
import { DaySection, type PreparedDay } from "./components/DaySection";

export type ItineraryDocumentProps = {
  // Buffers, no rutas: pasar una ruta absoluta de Windows (con letra de
  // unidad, ej. "C:\...") como src rompe a @react-pdf/renderer — su
  // resolución interna usa url.parse() y confunde "C:" con un esquema de
  // URL, así que intenta hacer fetch() sobre la ruta local y falla.
  coverImage: Buffer;
  letterheadImage: Buffer;
  passengerName: string;
  destination: string;
  startDate: string;
  endDate: string;
  overviewTitle: string;
  overviewDescription: string;
  flights: ItineraryFlight[];
  days: PreparedDay[];
};

/**
 * Los días NO empiezan en una página nueva: viven todos dentro de UN solo
 * <Page>, que @react-pdf/renderer parte automáticamente en tantas páginas
 * físicas como haga falta según el contenido. El membrete y el número de
 * página son `fixed`, así que se repiten igual en cada una de esas páginas.
 */
export function ItineraryDocument({
  coverImage,
  letterheadImage,
  passengerName,
  destination,
  startDate,
  endDate,
  overviewTitle,
  overviewDescription,
  flights,
  days,
}: ItineraryDocumentProps) {
  return (
    <Document title={`Itinerario - ${passengerName}`} author="Wander Travel">
      <CoverPage coverImage={coverImage} />

      <Page size={PDF_THEME.page.size} style={styles.contentPage}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de @react-pdf/renderer (PDF), no <img> HTML: no acepta alt */}
        <Image src={letterheadImage} fixed style={styles.letterheadBackground} />
        <Text
          fixed
          style={styles.pageNumber}
          render={({ pageNumber }) => String(pageNumber - 1)}
        />

        <SummarySection
          title={overviewTitle}
          description={overviewDescription}
          passengerName={passengerName}
          destination={destination}
          startDate={startDate}
          endDate={endDate}
        />

        <FlightsSection flights={flights} />

        {days.map((day, index) => (
          <DaySection key={day.day} day={day} isLast={index === days.length - 1} />
        ))}
      </Page>
    </Document>
  );
}
