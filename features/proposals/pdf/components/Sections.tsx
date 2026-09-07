import { View, Text, Image } from "@react-pdf/renderer";
import { proposalStyles as s } from "../styles";

export type PreparedService = {
  dayLabel: string;
  name: string;
  place: string;
  priceLabel: string | null;
  description: string;
  note: string;
};

export type PreparedTripImage = { buffer: Buffer; credit: string | null };

export function Presentation({ text }: { text: string }) {
  if (!text.trim()) return null;
  return (
    <View style={s.section} wrap={false} minPresenceAhead={80}>
      <Text style={s.sectionLabel}>Presentación</Text>
      <Text style={s.paragraph}>{text}</Text>
    </View>
  );
}

export function TripSection({
  facts,
  image,
  overview,
}: {
  facts: { label: string; value: string }[];
  image: PreparedTripImage | null;
  overview: string;
}) {
  return (
    <View style={s.section}>
      <View wrap={false} minPresenceAhead={120}>
        <Text style={s.sectionLabel}>Tu Viaje</Text>
        {image && (
          <>
            <View style={s.tripImageFrame}>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de @react-pdf/renderer, no <img> HTML */}
              <Image src={image.buffer} style={s.tripImage} />
            </View>
            {image.credit && <Text style={s.imageCredit}>{image.credit}</Text>}
          </>
        )}
        <View style={s.tripFacts}>
          {facts.map((fact) => (
            <View key={fact.label} style={s.fact}>
              <Text style={s.factLabel}>{fact.label}</Text>
              <Text style={s.factValue}>{fact.value}</Text>
            </View>
          ))}
        </View>
      </View>
      {overview.trim().length > 0 && <Text style={s.paragraph}>{overview}</Text>}
    </View>
  );
}

export function ServicesSection({ services }: { services: PreparedService[] }) {
  if (services.length === 0) return null;
  return (
    <View style={s.section}>
      <Text style={s.sectionLabel} wrap={false} minPresenceAhead={90}>
        Experiencias y Servicios
      </Text>
      {services.map((service, index) => {
        const isLast = index === services.length - 1;
        const meta = [service.dayLabel, service.place].filter((part) => part.trim().length > 0).join("  ·  ");
        return (
          <View
            key={index}
            style={isLast ? [s.serviceItem, s.serviceItemLast] : s.serviceItem}
            wrap={false}
          >
            <View style={s.serviceHeadRow}>
              <Text style={s.serviceName}>{service.name}</Text>
              {service.priceLabel && <Text style={s.servicePrice}>{service.priceLabel}</Text>}
            </View>
            {meta.length > 0 && <Text style={s.serviceMeta}>{meta}</Text>}
            {service.description.trim().length > 0 && (
              <Text style={s.serviceDescription}>{service.description}</Text>
            )}
            {service.note.trim().length > 0 && <Text style={s.serviceNote}>{service.note}</Text>}
          </View>
        );
      })}
    </View>
  );
}

export function InvestmentSection({ totalLabel }: { totalLabel: string }) {
  return (
    <View style={s.section} wrap={false} minPresenceAhead={80}>
      <Text style={s.sectionLabel}>Inversión</Text>
      <View style={s.investmentBox}>
        <Text style={s.investmentLabel}>Total de la propuesta</Text>
        <Text style={s.investmentTotal}>{totalLabel}</Text>
      </View>
      <Text style={s.investmentHint}>
        Precios en la moneda indicada. Sujetos a disponibilidad al momento de la reserva.
      </Text>
    </View>
  );
}

export function BulletSection({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <View style={s.section} wrap={false} minPresenceAhead={70}>
      <Text style={s.sectionLabel}>{label}</Text>
      {items.map((item, index) => (
        <View key={index} style={s.listItemRow}>
          <Text style={s.listItemBullet}>•</Text>
          <Text style={s.listItemText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export function NotesSection({ notes }: { notes: string }) {
  if (!notes.trim()) return null;
  return (
    <View style={s.section} wrap={false} minPresenceAhead={70}>
      <Text style={s.sectionLabel}>Notas Importantes</Text>
      <Text style={s.paragraph}>{notes}</Text>
    </View>
  );
}

export function ClosingSection({ text }: { text: string }) {
  if (!text.trim()) return null;
  return (
    <View style={s.closingBox} wrap={false} minPresenceAhead={60}>
      <Text style={s.closingText}>{text}</Text>
      <Text style={s.signature}>Wander Travel</Text>
    </View>
  );
}
