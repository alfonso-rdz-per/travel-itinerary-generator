import "server-only";
import path from "path";
import { readFile } from "fs/promises";
import { renderToBuffer } from "@react-pdf/renderer";
import type { EnrichedItinerary, ItineraryFlight } from "@/types/itinerary";
import { registerFonts } from "./fonts";
import { optimizeImageForPdf } from "./images";
import { ItineraryDocument } from "./document";
import { PDF_THEME } from "./theme";
import type { PreparedDay } from "./components/DaySection";
import type { PreparedImage } from "./components/DayImages";

const BRANDING_DIR = path.join(process.cwd(), "public", "branding");
const COVER_PATH = path.join(BRANDING_DIR, "cover.png");
const LETTERHEAD_PATH = path.join(BRANDING_DIR, "letterhead.png");

let brandingImagesCache: { cover: Buffer; letterhead: Buffer } | null = null;

/** cover.png/letterhead.png no cambian entre generaciones: se leen una sola vez por proceso. */
async function loadBrandingImages(): Promise<{ cover: Buffer; letterhead: Buffer }> {
  if (!brandingImagesCache) {
    const [cover, letterhead] = await Promise.all([readFile(COVER_PATH), readFile(LETTERHEAD_PATH)]);
    brandingImagesCache = { cover, letterhead };
  }
  return brandingImagesCache;
}

const CONTENT_WIDTH = PDF_THEME.page.width - PDF_THEME.page.marginX * 2;

/**
 * Ancho real del marco de imagen en el PDF según cuántas se muestren ese día
 * — usado para no incrustar la foto a más resolución de la que realmente se
 * imprime. Hoy cada día siempre trae una sola imagen (ver ARCHITECTURE.md,
 * Fase 8); el cálculo para 2 ya queda listo.
 */
function frameWidthPoints(imageCount: number): number {
  if (imageCount <= 1) return CONTENT_WIDTH * 0.62;
  const gap = 12;
  return (CONTENT_WIDTH - gap * (imageCount - 1)) / imageCount;
}

async function prepareDayImages(image: EnrichedItinerary["days"][number]["image"]): Promise<PreparedImage[]> {
  // "none": el agente eliminó explícitamente la imagen de este día desde el
  // editor (Fase 10) — a diferencia de "default", el PDF nunca debe mostrar
  // default-day.jpg aquí, es una decisión deliberada, no una falta de datos.
  if (image.source === "none") return [];

  // image.path (caso "default") ya es una ruta pública tipo "/branding/...":
  // optimizeImageForPdf/readSource la resuelve dentro de public/ — no
  // volver a unirla con process.cwd() aquí (duplicaría la ruta).
  const source = image.source === "unsplash" ? image.urls.regular : image.path;
  const width = frameWidthPoints(1);

  try {
    const buffer = await optimizeImageForPdf(source, width);
    const credit = image.source === "unsplash" ? `Fotografía: ${image.photographer} - Unsplash` : null;
    return [{ buffer, credit }];
  } catch (error) {
    console.error("[pdf] no se pudo preparar la imagen del día", error);
    return [];
  }
}

async function prepareDays(days: EnrichedItinerary["days"]): Promise<PreparedDay[]> {
  return Promise.all(
    days.map(async (day) => ({
      day: day.day,
      title: day.title,
      introduction: day.introduction,
      activities: day.activities,
      recommendations: day.recommendations,
      tips: day.tips,
      manualNotes: day.manualNotes ?? [],
      images: await prepareDayImages(day.image),
    })),
  );
}

export type GeneratePdfInput = {
  passengerName: string;
  destination: string;
  startDate: string;
  endDate: string;
  flights: ItineraryFlight[];
  generated: EnrichedItinerary;
};

export async function generateItineraryPdf(input: GeneratePdfInput): Promise<Buffer> {
  registerFonts();

  const [{ cover, letterhead }, days] = await Promise.all([
    loadBrandingImages(),
    prepareDays(input.generated.days),
  ]);

  return renderToBuffer(
    <ItineraryDocument
      coverImage={cover}
      letterheadImage={letterhead}
      passengerName={input.passengerName}
      destination={input.destination}
      startDate={input.startDate}
      endDate={input.endDate}
      overviewTitle={input.generated.overview.title}
      overviewDescription={input.generated.overview.description}
      flights={input.flights}
      days={days}
    />,
  );
}
