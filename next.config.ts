import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Garantiza que prompts/ viaje al bundle de servidor: se lee con fs en
  // tiempo de ejecución (services/gemini/promptLoader.ts), no vía import.
  outputFileTracingIncludes: {
    "/*": ["./prompts/**/*"],
  },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
