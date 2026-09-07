import { notFound } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import { ProposalPreview } from "@/features/proposals/components/ProposalPreview";
import { buildProposalView } from "@/features/proposals/present";
import type { ProposalInput, ProposalJsonData } from "@/types/proposal";

export default async function ProposalPreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) notFound();

  const { data: row, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !row) notFound();

  const jsonData = row.json_data as ProposalJsonData;

  // `input` siempre proviene de nuestro propio formulario (validado con Zod al
  // guardar). Si por algún motivo faltara, reconstruimos lo mínimo desde las
  // columnas para no romper la previsualización.
  const input: ProposalInput =
    jsonData?.input ??
    ({
      client: { name: row.client_name, email: row.client_email ?? "", phone: row.client_phone ?? "" },
      trip: {
        destination: row.destination,
        startDate: row.start_date ?? "",
        endDate: row.end_date ?? "",
        numDays: row.num_days,
        numTravelers: row.num_travelers,
        tripType: row.trip_type ?? "",
      },
      proposal: { title: row.title ?? "", introMessage: "", included: [], notIncluded: [], notes: "" },
      currency: row.currency,
      services: [],
    } satisfies ProposalInput);

  const generated = jsonData?.generated ?? null;
  const view = buildProposalView(input, generated);

  // Los datos se editaron después de generar el texto (p. ej. "Guardar cambios"
  // sin regenerar): el texto de la IA puede no reflejar los cambios.
  const textIsStale =
    !!generated &&
    new Date(row.updated_at).getTime() - new Date(generated.metadata.generatedAt).getTime() > 5000;

  return (
    <ProposalPreview
      proposalId={row.id}
      status={row.status}
      view={view}
      image={generated?.image ?? null}
      hasGenerated={!!generated}
      textIsStale={textIsStale}
    />
  );
}
