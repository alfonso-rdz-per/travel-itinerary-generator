import { NextResponse } from "next/server";
import { createClient } from "@/services/supabase/server";
import { generateProposalPdf } from "@/features/proposals/pdf/generateProposalPdf";
import {
  downloadProposalPdf,
  proposalPdfObjectPath,
  uploadProposalPdf,
} from "@/features/proposals/pdf/storage";
import type { ProposalJsonData } from "@/types/proposal";

export const runtime = "nodejs";

function sanitizeFilename(name: string): string {
  return name.trim().replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "propuesta";
}

function pdfResponse(buffer: Buffer, filename: string): NextResponse {
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Content-Length": String(buffer.byteLength),
    },
  });
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const { data: row, error: fetchError } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !row) {
    return NextResponse.json({ error: "No se encontró la propuesta." }, { status: 404 });
  }

  const jsonData = row.json_data as ProposalJsonData;
  const generated = jsonData?.generated;

  if (!generated || !jsonData.input) {
    return NextResponse.json(
      { error: "Esta propuesta todavía no ha sido generada." },
      { status: 400 },
    );
  }

  const filename = `Propuesta-${sanitizeFilename(row.client_name)}.pdf`;
  const objectPath = proposalPdfObjectPath(user.id, row.id);

  const isFresh =
    row.pdf_status === "ready" &&
    !!row.pdf_generated_at &&
    new Date(row.pdf_generated_at) >= new Date(row.updated_at);

  if (isFresh) {
    try {
      const cached = await downloadProposalPdf(supabase, objectPath);
      return pdfResponse(cached, filename);
    } catch (error) {
      console.error("[proposal-pdf] no se pudo reutilizar el PDF guardado, se regenerará", error);
    }
  }

  await supabase.from("proposals").update({ pdf_status: "generating" }).eq("id", row.id).eq("user_id", user.id);

  try {
    const buffer = await generateProposalPdf({ input: jsonData.input, generated });

    await uploadProposalPdf(supabase, objectPath, buffer);

    await supabase
      .from("proposals")
      .update({
        pdf_url: objectPath,
        pdf_generated_at: new Date().toISOString(),
        pdf_version: (row.pdf_version ?? 0) + 1,
        pdf_status: "ready",
      })
      .eq("id", row.id)
      .eq("user_id", user.id);

    return pdfResponse(buffer, filename);
  } catch (error) {
    console.error("[proposal-pdf] error al generar el PDF", error);
    await supabase.from("proposals").update({ pdf_status: "error" }).eq("id", row.id).eq("user_id", user.id);
    return NextResponse.json({ error: "No se pudo generar el PDF. Intenta de nuevo." }, { status: 500 });
  }
}
