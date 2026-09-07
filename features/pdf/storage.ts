import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const BUCKET = "pdfs";

export function pdfObjectPath(userId: string, itineraryId: string): string {
  return `${userId}/${itineraryId}.pdf`;
}

export async function uploadItineraryPdf(
  supabase: SupabaseClient<Database>,
  objectPath: string,
  buffer: Buffer,
): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).upload(objectPath, buffer, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (error) throw error;
}

export async function downloadItineraryPdf(
  supabase: SupabaseClient<Database>,
  objectPath: string,
): Promise<Buffer> {
  const { data, error } = await supabase.storage.from(BUCKET).download(objectPath);
  if (error) throw error;
  return Buffer.from(await data.arrayBuffer());
}
