import { notFound } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import { ProposalForm } from "@/features/proposals/components/ProposalForm";
import { proposalInputToFormState, formStateToValues } from "@/features/proposals/formState";
import type { ProposalInput, ProposalJsonData } from "@/types/proposal";

export default async function EditProposalPage({ params }: { params: Promise<{ id: string }> }) {
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

  // Normaliza cualquier dato viejo a la forma actual del input.
  const normalized = formStateToValues(proposalInputToFormState(input)) as ProposalInput;

  return <ProposalForm initialData={{ id: row.id, input: normalized }} />;
}
