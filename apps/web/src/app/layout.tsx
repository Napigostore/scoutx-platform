import type { Metadata } from "next";
import { Fraunces, Sora } from "next/font/google";
import type { ReactNode } from "react";

import { SessionProvider } from "@/components/auth/session-provider";
import { Providers } from "@/components/providers";
import { BetaBanner } from "@/components/layout/beta-banner";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { BRAND } from "@/lib/branding";

import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: BRAND.seo.defaultTitle,
  description: BRAND.seo.defaultDescription,
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? `https://${BRAND.domain}`),
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/logo-icon.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: BRAND.seo.defaultTitle,
    description: BRAND.seo.defaultDescription,
    siteName: BRAND.appName,
    url: BRAND.urls.website,
    images: [
      {
        url: "/logo.png",
        width: 1024,
        height: 1024,
        alt: `${BRAND.appName} - ${BRAND.tagline}`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.seo.defaultTitle,
    description: BRAND.seo.defaultDescription,
    creator: BRAND.social.twitter,
    images: ["/logo.png"],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sora.variable} ${fraunces.variable}`}>
      <body className="font-sans antialiased">
        <SessionProvider>
          <Providers>
            <div className="flex min-h-screen flex-col">
              <BetaBanner />
              <SiteHeader />
              <main className="flex-1">{children}</main>
              <SiteFooter />
            </div>
          </Providers>
        </SessionProvider>
      </body>
    </html>
  );
}
