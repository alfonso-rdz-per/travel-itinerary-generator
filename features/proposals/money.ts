import type { ProposalCurrency, ProposalServiceInput } from "@/types/proposal";

const CURRENCY_SYMBOL: Record<ProposalCurrency, string> = {
  MXN: "$",
  USD: "$",
  EUR: "€",
};

const numberFormat = new Intl.NumberFormat("es-MX", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/**
 * Formatea un monto tal como lo esperan las propuestas de Wander Travel:
 * "$1,850 MXN", "$2,500 USD", "€1,200 EUR". El símbolo y el código de moneda
 * son explícitos para que no haya ambigüedad en el documento final.
 */
export function formatMoney(amount: number, currency: ProposalCurrency): string {
  return `${CURRENCY_SYMBOL[currency]}${numberFormat.format(amount)} ${currency}`;
}

/**
 * Total de la propuesta = suma EXCLUSIVA de los precios capturados por el
 * agente. La IA nunca participa en este cálculo (ni recibe los precios).
 * Servicios con `price === null` no suman.
 */
export function proposalTotal(services: Pick<ProposalServiceInput, "price">[]): number {
  return services.reduce((total, service) => total + (service.price ?? 0), 0);
}
