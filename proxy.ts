import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase-proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Aplica a todas las rutas excepto assets estáticos de Next.js e imágenes.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
