import "server-only";
import path from "path";
import { readFile } from "fs/promises";
import { renderToBuffer } from "@react-pdf/renderer";
import { registerFonts } from "@/features/pdf/fonts";
import { optimizeImageForPdf } from "@/features/pdf/images";
import { PDF_THEME } from "@/features/pdf/theme";
import type { ProposalGenerated, ProposalInput } from "@/types/proposal";
import { buildProposalView } from "../present";
import { ProposalDocument } from "./document";
import type { PreparedService, PreparedTripImage } from "./components/Sections";

const BRANDING_DIR = path.join(process.cwd(), "public", "branding");
const COVER_PATH = path.join(BRANDING_DIR, "cover_propuesta.png");
const LETTERHEAD_PATH = path.join(BRANDING_DIR, "letterhead.png");

let brandingCache: { cover: Buffer; letterhead: Buffer } | null = null;

async function loadBranding(): Promise<{ cover: Buffer; letterhead: Buffer }> {
  if (!brandingCache) {
    const [cover, letterhead] = await Promise.all([readFile(COVER_PATH), readFile(LETTERHEAD_PATH)]);
    brandingCache = { cover, letterhead };
  }
  return brandingCache;
}

const CONTENT_WIDTH = PDF_THEME.page.width - PDF_THEME.page.marginX * 2;

async function prepareTripImage(image: ProposalGenerated["image"]): Promise<PreparedTripImage | null> {
  if (image.source !== "unsplash") return null;
  try {
    const buffer = await optimizeImageForPdf(image.urls.regular, CONTENT_WIDTH);
    return { buffer, credit: `Fotografía: ${image.photographer} — Unsplash` };
  } catch (error) {
    console.error("[proposal-pdf] no se pudo preparar la imagen del destino", error);
    return null;
  }
}

export type GenerateProposalPdfInput = {
  input: ProposalInput;
  generated: ProposalGenerated;
};

export async function generateProposalPdf({ input, generated }: GenerateProposalPdfInput): Promise<Buffer> {
  registerFonts();

  const view = buildProposalView(input, generated);
  const [{ cover, letterhead }, tripImage] = await Promise.all([
    loadBranding(),
    prepareTripImage(generated.image),
  ]);

  const services: PreparedService[] = view.services.map((service) => ({
    dayLabel: service.dayLabel,
    name: service.name,
    place: service.place,
    priceLabel: service.priceLabel,
    description: service.description,
    note: service.note,
  }));

  return renderToBuffer(
    <ProposalDocument
      coverImage={cover}
      letterheadImage={letterhead}
      documentTitle={view.documentTitle}
      clientName={view.clientName}
      destination={view.destination}
      dateLabel={view.dateLabel}
      tripFacts={view.tripFacts}
      presentation={view.presentation}
      tripOverview={view.tripOverview}
      tripImage={tripImage}
      services={services}
      totalLabel={view.totalLabel}
      included={view.included}
      notIncluded={view.notIncluded}
      notes={view.notes}
      closing={view.closing}
    />,
  );
}
