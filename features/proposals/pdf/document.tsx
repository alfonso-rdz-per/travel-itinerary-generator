import { Document, Page, Image, Text } from "@react-pdf/renderer";
import { PDF_THEME } from "@/features/pdf/theme";
import { proposalStyles as s } from "./styles";
import { ProposalCoverPage } from "./components/CoverPage";
import {
  Presentation,
  TripSection,
  ServicesSection,
  InvestmentSection,
  BulletSection,
  NotesSection,
  ClosingSection,
  type PreparedService,
  type PreparedTripImage,
} from "./components/Sections";

export type ProposalDocumentProps = {
  coverImage: Buffer;
  letterheadImage: Buffer;
  documentTitle: string;
  clientName: string;
  destination: string;
  dateLabel: string | null;
  tripFacts: { label: string; value: string }[];
  presentation: string;
  tripOverview: string;
  tripImage: PreparedTripImage | null;
  services: PreparedService[];
  totalLabel: string;
  included: string[];
  notIncluded: string[];
  notes: string;
  closing: string;
};

export function ProposalDocument(props: ProposalDocumentProps) {
  return (
    <Document title={props.documentTitle} author="Wander Travel">
      <ProposalCoverPage
        coverImage={props.coverImage}
        clientName={props.clientName}
        destination={props.destination}
        dateLabel={props.dateLabel}
      />

      <Page size={PDF_THEME.page.size} style={s.contentPage}>
        {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de @react-pdf/renderer, no <img> HTML */}
        <Image src={props.letterheadImage} fixed style={s.letterheadBackground} />
        <Text fixed style={s.pageNumber} render={({ pageNumber }) => String(pageNumber - 1)} />

        <Text style={s.docTitle}>{props.documentTitle}</Text>
        <Text style={s.docSubtitle}>
          {props.clientName} · {props.destination}
          {props.dateLabel ? ` · ${props.dateLabel}` : ""}
        </Text>

        <Presentation text={props.presentation} />
        <TripSection facts={props.tripFacts} image={props.tripImage} overview={props.tripOverview} />
        <ServicesSection services={props.services} />
        <InvestmentSection totalLabel={props.totalLabel} />
        <BulletSection label="Incluye" items={props.included} />
        <BulletSection label="No Incluye" items={props.notIncluded} />
        <NotesSection notes={props.notes} />
        <ClosingSection text={props.closing} />
      </Page>
    </Document>
  );
}
