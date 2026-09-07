"use client";

import { usePathname } from "next/navigation";

const LABELS: Record<string, string> = {
  "/dashboard": "Itinerarios",
  "/itineraries/new": "Itinerarios / Nuevo itinerario",
  "/proposals": "Propuestas de Viaje",
  "/proposals/new": "Propuestas de Viaje / Nueva propuesta",
};

export function HeaderBreadcrumb() {
  const pathname = usePathname();

  let label = LABELS[pathname];

  if (!label && pathname.startsWith("/proposals/")) {
    label = pathname.endsWith("/edit")
      ? "Propuestas de Viaje / Editar propuesta"
      : "Propuestas de Viaje / Propuesta";
  }

  if (!label) {
    label = pathname.endsWith("/edit") ? "Itinerarios / Editar itinerario" : "Itinerarios";
  }

  return <span className="text-sm font-medium text-muted-foreground">{label}</span>;
}
