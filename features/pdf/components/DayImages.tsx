import { View, Image, Text } from "@react-pdf/renderer";
import { styles } from "../styles";

export type PreparedImage = { buffer: Buffer; credit: string | null };

/**
 * Una o dos imágenes (nunca más) lado a lado — nunca una encima de la otra.
 * `wrap={false}` en el contenedor: una imagen nunca se corta entre páginas,
 * si no cabe completa se mueve entera a la siguiente.
 */
export function DayImages({ images }: { images: PreparedImage[] }) {
  if (images.length === 0) return null;

  const isSingle = images.length === 1;

  return (
    <View style={styles.imagesRow} wrap={false}>
      {images.map((image, index) => (
        <View key={index} style={isSingle ? styles.imageColumnSingle : styles.imageColumnPaired}>
          <View style={styles.imageFrame}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de @react-pdf/renderer (PDF), no <img> HTML: no acepta alt */}
            <Image src={image.buffer} style={styles.image} />
          </View>
          {image.credit && <Text style={styles.imageCredit}>{image.credit}</Text>}
        </View>
      ))}
    </View>
  );
}
