import Link from "next/link";
import Image from "next/image";
import { BRAND } from "@/lib/branding";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 border-t border-[var(--scoutx-border)] bg-[color-mix(in_srgb,var(--scoutx-hero-from)_92%,black)] text-[var(--scoutx-primary-foreground)]">
      <div className="section-shell grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div className="space-y-4">
          <Link href="/" className="inline-block transition-opacity hover:opacity-90">
            <Image
              src="/logo-header-white.png"
              alt={BRAND.appName}
              width={160}
              height={36}
              className="h-8 w-auto object-contain sm:h-9"
            />
          </Link>
          <p className="max-w-sm text-sm text-white/75">
            {BRAND.fullTagline} Connect with verified local scouts to inspect, verify, and collect
            on-site evidence anywhere in the world.
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-semibold uppercase tracking-[0.14em] text-white/55">Product</p>
          <ul className="space-y-2 text-white/80">
            <li>
              <Link href="#composer">Mission composer</Link>
            </li>
            <li>
              <Link href="#how-it-works">How it works</Link>
            </li>
            <li>
              <Link href="#trending">Trending missions</Link>
            </li>
          </ul>
        </div>
        <div className="space-y-3 text-sm">
          <p className="font-semibold uppercase tracking-[0.14em] text-white/55">Company</p>
          <ul className="space-y-2 text-white/80">
            <li>
              <a href={`mailto:${BRAND.emails.default}`}>{BRAND.emails.default}</a>
            </li>
            <li>
              <Link href="/privacy">Privacy & Terms</Link>
            </li>
            <li>
              <a href={`mailto:${BRAND.emails.support}`}>Support</a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="section-shell flex flex-col gap-2 py-5 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {BRAND.companyName} All rights reserved. ({BRAND.tagline})
          </p>
          <p>Built for grounded decisions in the physical world.</p>
        </div>
      </div>
    </footer>
  );
}
