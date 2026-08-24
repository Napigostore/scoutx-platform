import Link from "next/link";

import { AuthHeaderActions } from "@/components/auth/auth-header";
import { BRAND } from "@/lib/branding";

const navItems = [
  { href: "/missions", label: "Missions" },
  { href: "/scouts", label: "Top Scouters" },
  { href: "/market", label: "Market Intelligence" },
] as const;

export function SiteHeader() {
  return (
    <header className="border-[var(--scoutx-border)]/70 sticky top-0 z-40 border-b bg-[color-mix(in_srgb,var(--scoutx-background)_82%,white)] backdrop-blur-md">
      <div className="section-shell flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="font-display text-xl font-bold tracking-tight text-[var(--scoutx-hero-from)]"
        >
          {BRAND.appName}
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-[var(--scoutx-muted-foreground)] md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition-colors hover:text-[var(--scoutx-foreground)]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <AuthHeaderActions />
      </div>
    </header>
  );
}
