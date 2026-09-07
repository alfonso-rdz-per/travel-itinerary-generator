import { StyleSheet } from "@react-pdf/renderer";
import { PDF_THEME } from "@/features/pdf/theme";

const { color, font, page } = PDF_THEME;

export const proposalStyles = StyleSheet.create({
  coverPage: {
    padding: 0,
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  // Bloque de texto sobre el tercio inferior (liso) de cover_propuesta.png,
  // por debajo del "Propuesta de Viaje" ya impreso en la imagen.
  coverText: {
    position: "absolute",
    left: 56,
    right: 56,
    top: page.height * 0.74,
    color: "#ffffff",
    textAlign: "center",
  },
  coverClient: {
    fontFamily: font.family,
    fontSize: 24,
    fontWeight: 700,
    marginBottom: 10,
  },
  coverDivider: {
    alignSelf: "center",
    width: 44,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.6)",
    marginBottom: 12,
  },
  coverDestination: {
    fontFamily: font.family,
    fontSize: 13,
    fontWeight: 600,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  coverDates: {
    fontFamily: font.family,
    fontSize: 10.5,
    color: "rgba(255,255,255,0.85)",
  },

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
    opacity: 0.12,
  },
  pageNumber: {
    position: "absolute",
    top: page.height - 40,
    left: 0,
    right: page.marginX,
    textAlign: "right",
    fontSize: 9,
    color: color.muted,
  },

  docTitle: {
    fontSize: 20,
    fontWeight: 700,
    color: color.text,
    marginBottom: 4,
  },
  docSubtitle: {
    fontSize: 9.5,
    color: color.muted,
    marginBottom: 22,
  },

  section: {
    marginTop: 22,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: color.primary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 10.5,
    lineHeight: 1.6,
  },

  tripImageFrame: {
    width: "100%",
    height: 200,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  tripImage: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  imageCredit: {
    fontSize: 7,
    color: color.credit,
    marginBottom: 12,
  },

  tripFacts: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 28,
    rowGap: 8,
    marginBottom: 12,
  },
  fact: {
    minWidth: 120,
  },
  factLabel: {
    fontSize: 8,
    color: color.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  factValue: {
    fontSize: 10.5,
    fontWeight: 600,
  },

  serviceItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 0.75,
    borderBottomColor: color.credit,
  },
  serviceItemLast: {
    marginBottom: 4,
  },
  serviceHeadRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 2,
  },
  serviceName: {
    fontSize: 11,
    fontWeight: 700,
    flex: 1,
  },
  servicePrice: {
    fontSize: 10.5,
    fontWeight: 700,
    color: color.primary,
  },
  serviceMeta: {
    fontSize: 8.5,
    color: color.muted,
    marginBottom: 3,
  },
  serviceDescription: {
    fontSize: 10,
    lineHeight: 1.55,
  },
  serviceNote: {
    fontSize: 8.5,
    color: color.muted,
    marginTop: 3,
  },

  investmentBox: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: color.primary,
    borderRadius: 3,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  investmentLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: color.text,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  investmentTotal: {
    fontSize: 16,
    fontWeight: 700,
    color: color.primary,
  },
  investmentHint: {
    fontSize: 8,
    color: color.muted,
    marginTop: 6,
  },

  listItemRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  listItemBullet: {
    fontSize: 10.5,
    width: 12,
    color: color.primary,
  },
  listItemText: {
    fontSize: 10,
    lineHeight: 1.5,
    flex: 1,
  },

  closingBox: {
    marginTop: 22,
    borderTopWidth: 0.75,
    borderTopColor: color.primary,
    paddingTop: 12,
  },
  closingText: {
    fontSize: 10.5,
    lineHeight: 1.6,
    color: color.muted,
  },
  signature: {
    fontSize: 10,
    fontWeight: 700,
    color: color.primary,
    marginTop: 10,
  },
});
