import type {
  ProposalCurrency,
  ProposalGenerated,
  ProposalInput,
  ProposalJsonData,
} from "@/types/proposal";
import type { Database, ItineraryStatus } from "@/types/database";
import { proposalTotal } from "./money";

/** Fila liviana para el listado de propuestas. */
export type ProposalListItem = {
  id: string;
  clientName: string;
  destination: string;
  title: string | null;
  startDate: string | null;
  endDate: string | null;
  numTravelers: number | null;
  currency: ProposalCurrency;
  /** Total del presupuesto = suma de los precios capturados por el agente (código, no IA). */
  total: number;
  status: ItineraryStatus;
  createdAt: string;
  updatedAt: string;
};

export const PROPOSAL_LIST_COLUMNS =
  "id, client_name, destination, title, start_date, end_date, num_travelers, currency, status, created_at, updated_at, json_data";

export type ProposalListRow = Pick<
  Database["public"]["Tables"]["proposals"]["Row"],
  | "id"
  | "client_name"
  | "destination"
  | "title"
  | "start_date"
  | "end_date"
  | "num_travelers"
  | "currency"
  | "status"
  | "created_at"
  | "updated_at"
  | "json_data"
>;

export function toProposalListItem(row: ProposalListRow): ProposalListItem {
  const jsonData = (row.json_data ?? {}) as unknown as ProposalJsonData;
  return {
    id: row.id,
    clientName: row.client_name,
    destination: row.destination,
    title: row.title,
    startDate: row.start_date,
    endDate: row.end_date,
    numTravelers: row.num_travelers,
    currency: row.currency,
    total: proposalTotal(jsonData?.input?.services ?? []),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Propuesta completa, tal como la consume la previsualización y el PDF. */
export type ProposalDetail = {
  id: string;
  status: ItineraryStatus;
  currency: ProposalCurrency;
  input: ProposalInput;
  generated: ProposalGenerated | null;
  createdAt: string;
  updatedAt: string;
};
