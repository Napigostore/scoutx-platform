import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://scoutx.com";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/missions/*/edit", "/scout/missions/*/work"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
