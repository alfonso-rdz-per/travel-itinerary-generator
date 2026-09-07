import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProposalsList } from "@/features/proposals/components/ProposalsList";
import { PROPOSAL_LIST_COLUMNS, toProposalListItem, type ProposalListRow } from "@/features/proposals/types";
import { createClient } from "@/services/supabase/server";

const NOTICES: Record<string, string> = {
  saved: "Borrador guardado correctamente.",
  updated: "Cambios guardados correctamente.",
  generated: "Propuesta actualizada y regenerada correctamente.",
  duplicated: "Propuesta duplicada correctamente.",
};

export default async function ProposalsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  const { notice } = await searchParams;
  const noticeMessage = notice ? NOTICES[notice] : undefined;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: rows, error } = user
    ? await supabase
        .from("proposals")
        .select(PROPOSAL_LIST_COLUMNS)
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
    : { data: null, error: null };

  if (error) {
    console.error("[ProposalsPage] load", error);
  }

  const proposals = ((rows ?? []) as ProposalListRow[]).map(toProposalListItem);

  return (
    <div className="flex flex-1 flex-col">
      {error && (
        <div className="px-4 pt-4 lg:px-8">
          <Alert variant="destructive">
            <AlertDescription>
              No se pudieron cargar tus propuestas en este momento. Intenta recargar la página.
            </AlertDescription>
          </Alert>
        </div>
      )}
      {noticeMessage && (
        <div className="px-4 pt-4 lg:px-8">
          <Alert>
            <AlertDescription>{noticeMessage}</AlertDescription>
          </Alert>
        </div>
      )}
      <ProposalsList proposals={proposals} />
    </div>
  );
}
