import { Page, Image, View, Text } from "@react-pdf/renderer";
import { PDF_THEME } from "@/features/pdf/theme";
import { proposalStyles as s } from "../styles";

/**
 * Portada de la propuesta: cover_propuesta.png a sangre completa (ya trae
 * impresos el logo "WANDER TRAVEL" y "Propuesta de Viaje") + el nombre del
 * cliente, el destino principal y las fechas sobrepuestos en blanco sobre la
 * mitad inferior lisa de la imagen. Nunca usa cover.png (el de itinerarios).
 */
export function ProposalCoverPage({
  coverImage,
  clientName,
  destination,
  dateLabel,
}: {
  coverImage: Buffer;
  clientName: string;
  destination: string;
  dateLabel: string | null;
}) {
  return (
    <Page size={PDF_THEME.page.size} style={s.coverPage}>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de @react-pdf/renderer, no <img> HTML */}
      <Image src={coverImage} style={s.coverImage} />
      <View style={s.coverText}>
        <Text style={s.coverClient}>{clientName}</Text>
        <View style={s.coverDivider} />
        <Text style={s.coverDestination}>{destination}</Text>
        {dateLabel && <Text style={s.coverDates}>{dateLabel}</Text>}
      </View>
    </Page>
  );
}
