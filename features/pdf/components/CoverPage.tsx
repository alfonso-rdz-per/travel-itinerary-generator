import { Page, Image } from "@react-pdf/renderer";
import { styles } from "../styles";
import { PDF_THEME } from "../theme";

/** Portada: únicamente cover.png a sangre completa. Sin texto, sin numeración, sin pie de página. */
export function CoverPage({ coverImage }: { coverImage: Buffer }) {
  return (
    <Page size={PDF_THEME.page.size} style={styles.coverPage}>
      {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de @react-pdf/renderer (PDF), no <img> HTML: no acepta alt */}
      <Image src={coverImage} style={styles.coverImage} />
    </Page>
  );
}
