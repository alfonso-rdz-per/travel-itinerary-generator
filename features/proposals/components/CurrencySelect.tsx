"use client";

import { cn } from "@/lib/utils";
import { PROPOSAL_CURRENCIES, type ProposalCurrency } from "@/types/proposal";

const LABELS: Record<ProposalCurrency, string> = {
  MXN: "MXN — Peso mexicano",
  USD: "USD — Dólar estadounidense",
  EUR: "EUR — Euro",
};

export function CurrencySelect({
  value,
  onChange,
  id,
}: {
  value: ProposalCurrency;
  onChange: (value: ProposalCurrency) => void;
  id?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value as ProposalCurrency)}
      className={cn(
        "h-9 w-full rounded-lg border border-input bg-background px-3 text-sm shadow-xs outline-none",
        "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
      )}
    >
      {PROPOSAL_CURRENCIES.map((currency) => (
        <option key={currency} value={currency}>
          {LABELS[currency]}
        </option>
      ))}
    </select>
  );
}
