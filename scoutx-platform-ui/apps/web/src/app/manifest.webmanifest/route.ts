import { BRAND } from "@/lib/branding";

export async function GET() {
  const manifest = {
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

  return new Response(JSON.stringify(manifest), {
    headers: {
      "Content-Type": "application/manifest+json",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
