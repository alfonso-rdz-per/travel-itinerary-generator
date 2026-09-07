import "server-only";
import { readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

/** ~200dpi: buena calidad de impresión sin generar archivos pesados innecesariamente. */
const TARGET_DPI = 200;
const POINTS_PER_INCH = 72;
const JPEG_QUALITY = 78;

function pointsToPixels(points: number): number {
  return Math.round((points / POINTS_PER_INCH) * TARGET_DPI);
}

async function readSource(source: string): Promise<Buffer> {
  if (source.startsWith("http://") || source.startsWith("https://")) {
    const response = await fetch(source, { cache: "no-store" });
    if (!response.ok) throw new Error(`No se pudo descargar la imagen (${response.status}): ${source}`);
    return Buffer.from(await response.arrayBuffer());
  }
  // Ruta local dentro de public/ (ej. /branding/default-day.jpg).
  const relative = source.startsWith("/") ? source.slice(1) : source;
  return readFile(path.join(process.cwd(), "public", relative));
}

/**
 * Descarga (si aplica) y reoptimiza una imagen para el PDF: la reduce al
 * ancho realmente necesario en el documento (evita incrustar fotos de
 * Unsplash a resolución completa) y la reencoda como JPEG de buena calidad.
 * Nunca modifica los archivos originales en disco.
 */
export async function optimizeImageForPdf(source: string, frameWidthPoints: number): Promise<Buffer> {
  const raw = await readSource(source);
  const targetWidth = pointsToPixels(frameWidthPoints);

  return sharp(raw)
    .rotate() // respeta el EXIF orientation antes de recortar
    .resize({ width: targetWidth, withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toBuffer();
}
