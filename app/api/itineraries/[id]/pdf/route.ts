import { NextResponse } from "next/server";
import { createClient } from "@/services/supabase/server";
import { generateItineraryPdf } from "@/features/pdf/generatePdf";
import { downloadItineraryPdf, pdfObjectPath, uploadItineraryPdf } from "@/features/pdf/storage";
import type { ItineraryJsonData } from "@/types/itinerary";

export const runtime = "nodejs";

function sanitizeFilename(name: string): string {
  return name.trim().replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "itinerario";
}

function pdfResponse(buffer: Buffer, filename: string): NextResponse {
  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      // inline (no attachment): abre en una vista previa en la pestaña,
      // desde donde el navegador ya permite descargar/imprimir.
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
    .from("itineraries")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !row) {
    return NextResponse.json({ error: "No se encontró el itinerario." }, { status: 404 });
  }

  const jsonData = row.json_data as ItineraryJsonData;
  const generated = jsonData.generated;

  if (!generated) {
    return NextResponse.json(
      { error: "Este itinerario todavía no ha sido generado con IA." },
      { status: 400 },
    );
  }

  const filename = `Itinerario-${sanitizeFilename(row.passenger_name)}.pdf`;
  const objectPath = pdfObjectPath(user.id, row.id);

  const isFresh =
    row.pdf_status === "ready" &&
    !!row.pdf_generated_at &&
    new Date(row.pdf_generated_at) >= new Date(row.updated_at);

  // No volver a generar si no hay cambios desde la última vez: se reutiliza
  // el PDF ya guardado en Storage.
  if (isFresh) {
    try {
      const cached = await downloadItineraryPdf(supabase, objectPath);
      return pdfResponse(cached, filename);
    } catch (error) {
      console.error("[pdf] no se pudo reutilizar el PDF guardado, se regenerará", error);
      // sigue abajo y regenera
    }
  }

  await supabase.from("itineraries").update({ pdf_status: "generating" }).eq("id", row.id).eq("user_id", user.id);

  try {
    const buffer = await generateItineraryPdf({
      passengerName: row.passenger_name,
      destination: row.destination,
      startDate: row.start_date,
      endDate: row.end_date,
      flights: jsonData.input.flights ?? [],
      generated,
    });

    await uploadItineraryPdf(supabase, objectPath, buffer);

    await supabase
      .from("itineraries")
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
    console.error("[pdf] error al generar el PDF", error);
    await supabase.from("itineraries").update({ pdf_status: "error" }).eq("id", row.id).eq("user_id", user.id);
    return NextResponse.json(
      { error: "No se pudo generar el PDF. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
