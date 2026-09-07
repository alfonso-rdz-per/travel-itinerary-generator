/** Tokens de diseño del PDF — pedidos explícitamente por la Fase 8. */
export const PDF_THEME = {
  color: {
    primary: "#444197",
    text: "#242424",
    muted: "#5B5B5B",
    credit: "#B3B3B3",
  },
  font: {
    family: "Montserrat",
  },
  page: {
    size: "LETTER" as const, // cover.png/letterhead.png están diseñados a esta proporción (1545x2000 ≈ 8.5x11in)
    width: 612,
    height: 792,
    marginX: 56,
    marginTop: 72,
    marginBottom: 56,
  },
};
