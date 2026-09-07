/** Subconjunto de /search/photos que realmente se usa (Unsplash devuelve más campos). */
export type UnsplashPhoto = {
  id: string;
  width: number;
  height: number;
  color: string | null;
  likes: number;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  links: {
    html: string;
    download_location: string;
  };
  user: {
    name: string;
    links: {
      html: string;
    };
  };
};

export type UnsplashSearchResponse = {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
};

/** Una foto candidata junto con su posición dentro de los resultados de SU búsqueda. */
export type RankedPhoto = {
  photo: UnsplashPhoto;
  rank: number;
  poolSize: number;
};

/** RankedPhoto + qué texto de búsqueda la produjo (para trazabilidad y atribución). */
export type SourcedPhoto = RankedPhoto & { query: string };

/** Nunca confiar ciegamente en la respuesta de una API externa: filtra resultados incompletos. */
export function isUnsplashPhoto(value: unknown): value is UnsplashPhoto {
  if (!value || typeof value !== "object") return false;
  const v = value as Partial<UnsplashPhoto>;
  return (
    typeof v.id === "string" &&
    typeof v.width === "number" &&
    typeof v.height === "number" &&
    typeof v.likes === "number" &&
    typeof v.urls?.regular === "string" &&
    typeof v.urls?.full === "string" &&
    typeof v.urls?.small === "string" &&
    typeof v.urls?.thumb === "string" &&
    typeof v.urls?.raw === "string" &&
    typeof v.links?.download_location === "string" &&
    typeof v.links?.html === "string" &&
    typeof v.user?.name === "string" &&
    typeof v.user?.links?.html === "string"
  );
}
