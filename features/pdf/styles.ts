import { StyleSheet } from "@react-pdf/renderer";
import { PDF_THEME } from "./theme";

const { color, font, page } = PDF_THEME;

export const styles = StyleSheet.create({
  coverPage: {
    padding: 0,
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },

  // El padding vive en el propio <Page> (no en un View interno): así es
  // como @react-pdf/renderer calcula correctamente dónde caen los
  // elementos `fixed` con position:absolute en cada página repetida — con
  // el padding en un wrapper interno, el pie de página (número) terminaba
  // posicionándose en el punto donde el contenido de esa página termina,
  // no en el borde real de la hoja.
  contentPage: {
    paddingTop: page.marginTop,
    paddingBottom: page.marginBottom,
    paddingHorizontal: page.marginX,
    fontFamily: font.family,
    fontSize: 10.5,
    lineHeight: 1.5,
    color: color.text,
  },
  letterheadBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    // Sutil, a propósito: es fondo de página, nunca debe competir con el
    // contenido que se dibuja encima (ver nota en el reporte final sobre
    // este archivo). Antes 0.05 — casi imperceptible en pantalla normal;
    // subido a 0.15 (2026-08-10) para que se note sin estorbar la lectura.
    opacity: 0.15,
  },
  // `bottom` + `render` no combinan bien en @react-pdf/renderer: un nodo
  // `fixed` dinámico (con `render`) resetea su propia altura a 0 para
  // remedirse en cada página, y ese 0 contamina el cálculo de un ancla
  // `bottom` (que depende de la altura del propio nodo) — el resultado es
  // texto mal ubicado o, envuelto en un View absoluto, invisible en todas
  // las páginas (verificado inspeccionando los content streams del PDF
  // generado, no solo el viewer). Un ancla `top` con valor fijo no depende
  // de la altura del nodo, así que evita el problema por completo.
  pageNumber: {
    position: "absolute",
    top: page.height - 40,
    left: 0,
    right: page.marginX,
    textAlign: "right",
    fontSize: 9,
    color: color.muted,
  },

  overviewTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: color.text,
    marginBottom: 10,
  },
  overviewMeta: {
    fontSize: 9.5,
    color: color.muted,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: color.text,
    marginBottom: 8,
  },
  overviewDescription: {
    fontSize: 11,
    lineHeight: 1.6,
  },

  flightsSection: {
    marginTop: 16,
    borderWidth: 0.75,
    borderColor: color.primary,
    borderRadius: 3,
    padding: 12,
  },
  flightRow: {
    marginBottom: 6,
  },
  flightRowLast: {
    marginBottom: 0,
  },
  flightDescription: {
    fontSize: 10.5,
    lineHeight: 1.5,
  },
  flightWhen: {
    fontSize: 9,
    color: color.muted,
    marginTop: 1,
  },

  daySection: {
    marginTop: 26,
  },
  dayHeader: {
    marginBottom: 8,
  },
  dayTitle: {
    fontSize: 15,
    fontWeight: 700,
    color: color.primary,
    marginBottom: 6,
  },
  manualNotes: {
    marginBottom: 10,
  },
  manualNote: {
    fontSize: 10,
    lineHeight: 1.5,
    marginBottom: 2,
  },
  manualNoteTitle: {
    fontWeight: 700,
  },
  dayIntroduction: {
    fontSize: 10.5,
    lineHeight: 1.6,
  },

  imagesRow: {
    flexDirection: "row",
    columnGap: 12,
    marginVertical: 14,
  },
  imageColumnSingle: {
    width: "62%",
  },
  imageColumnPaired: {
    flex: 1,
  },
  imageFrame: {
    width: "100%",
    height: 190,
    borderRadius: 3,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  imageCredit: {
    fontSize: 7,
    color: color.credit,
    marginTop: 4,
  },

  activitiesList: {
    marginTop: 4,
  },
  activityItem: {
    marginBottom: 10,
  },
  activityBullet: {
    fontSize: 11,
    fontWeight: 600,
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 10.5,
    lineHeight: 1.55,
  },

  recommendationsSection: {
    marginTop: 12,
  },
  tipsSection: {
    marginTop: 12,
    borderWidth: 0.75,
    borderColor: color.primary,
    borderRadius: 3,
    padding: 12,
  },
  listItemRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  listItemBullet: {
    fontSize: 10.5,
    width: 12,
  },
  listItemText: {
    fontSize: 10.5,
    lineHeight: 1.5,
    flex: 1,
  },

  daySeparator: {
    borderBottomWidth: 0.75,
    borderBottomColor: color.primary,
    marginTop: 22,
    marginBottom: 4,
  },
});
