import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Los PDF de propuestas viven en el MISMO bucket privado `pdfs` que los de
 * itinerarios (0003_pdf_storage.sql), bajo `{user_id}/proposal-{id}.pdf`. La
 * RLS de ese bucket ya exige `auth.uid() = foldername(name)[1]`, así que el
 * prefijo `proposal-` en el nombre del archivo no necesita nada nuevo.
 */
const BUCKET = "pdfs";

export function proposalPdfObjectPath(userId: string, proposalId: string): string {
  return `${userId}/proposal-${proposalId}.pdf`;
}

export async function uploadProposalPdf(
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

export async function downloadProposalPdf(
  supabase: SupabaseClient<Database>,
  objectPath: string,
): Promise<Buffer> {
  const { data, error } = await supabase.storage.from(BUCKET).download(objectPath);
  if (error) throw error;
  return Buffer.from(await data.arrayBuffer());
}

export async function deleteProposalPdf(
  supabase: SupabaseClient<Database>,
  userId: string,
  proposalId: string,
): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([proposalPdfObjectPath(userId, proposalId)]);
  if (error) throw error;
}
