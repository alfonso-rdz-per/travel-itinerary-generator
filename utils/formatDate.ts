const shortDate = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const shortDateNoYear = new Intl.DateTimeFormat("es-MX", {
  day: "numeric",
  month: "short",
});

export function formatDate(isoDate: string): string {
  return shortDate.format(new Date(isoDate));
}

/**
 * Igual que formatDate pero para strings "YYYY-MM-DD" sin hora (input date):
 * las parsea como fecha de calendario local para no correrlas un día por el
 * huso horario. Ver la nota de parseCalendarDate.
 */
export function formatCalendarDate(dateOnlyIso: string): string {
  return shortDate.format(parseCalendarDate(dateOnlyIso));
}

/**
 * start_date/end_date son columnas `date` de Postgres ("YYYY-MM-DD", sin hora).
 * `new Date("YYYY-MM-DD")` las interpreta como medianoche UTC, lo que las
 * corre un día hacia atrás al formatear en husos horarios detrás de UTC.
 * Se parsean como fecha de calendario local para evitar ese desfase.
 */
function parseCalendarDate(dateOnlyIso: string): Date {
  const [year, month, day] = dateOnlyIso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/** Ej. "10 – 20 may 2026" o "28 abr – 3 may 2026" si cruza de mes. */
export function formatDateRange(startIso: string, endIso: string): string {
  const start = parseCalendarDate(startIso);
  const end = parseCalendarDate(endIso);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

  const startLabel = sameMonth ? start.getDate().toString() : shortDateNoYear.format(start);
  const endLabel = shortDate.format(end);

  return `${startLabel} – ${endLabel}`;
}
