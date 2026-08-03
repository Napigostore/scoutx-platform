import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/branding";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${BRAND.appName} — ${BRAND.tagline}`,
    short_name: BRAND.appName,
    description: BRAND.seo.defaultDescription,
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0f172a",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
