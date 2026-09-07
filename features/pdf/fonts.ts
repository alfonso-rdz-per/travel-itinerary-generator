import "server-only";
import path from "path";
import { Font } from "@react-pdf/renderer";

const FONTS_DIR = path.join(process.cwd(), "public", "fonts");

let registered = false;

/**
 * @react-pdf/renderer no usa fuentes del sistema: hay que registrar los
 * archivos .ttf explícitamente. Se hace una sola vez por proceso — Font.register
 * es una operación global del módulo, registrarla de nuevo en cada PDF es
 * innecesario y algo más lento.
 */
export function registerFonts(): void {
  if (registered) return;

  Font.register({
    family: "Montserrat",
    fonts: [
      { src: path.join(FONTS_DIR, "Montserrat-Regular.ttf"), fontWeight: 400 },
      { src: path.join(FONTS_DIR, "Montserrat-Medium.ttf"), fontWeight: 500 },
      { src: path.join(FONTS_DIR, "Montserrat-SemiBold.ttf"), fontWeight: 600 },
      { src: path.join(FONTS_DIR, "Montserrat-Bold.ttf"), fontWeight: 700 },
    ],
  });

  // No se registra un callback de hyphenation personalizado: se probó
  // Font.registerHyphenationCallback((word) => [word]) (pensado para evitar
  // que el hyphenation por defecto parta palabras raro en español) y
  // reproducía un bug real de @react-pdf/renderer que descarta la primera
  // letra de títulos largos al calcular el salto de línea (confirmado
  // generando un PDF real: "Itinerario..." se convertía en "tinerario...").
  // El motor de hyphenation propio de la librería (el que se usa cuando no
  // se registra ningún callback) no tiene ese problema y sigue evitando
  // cortes de palabra feos — verificado con un título largo real.

  registered = true;
}
