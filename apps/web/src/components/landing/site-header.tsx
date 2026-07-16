import Link from "next/link";

import { Button } from "@scoutx/ui";

const navItems = [
  { href: "#composer", label: "Compose" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#trending", label: "Trending" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--scoutx-border)]/70 bg-[color-mix(in_srgb,var(--scoutx-background)_82%,white)] backdrop-blur-md">
      <div className="section-shell flex h-16 items-center justify-between gap-4">
        <Link href="/" className="font-display text-xl tracking-tight text-[var(--scoutx-hero-from)]">
          ScoutX
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-[var(--scoutx-muted-foreground)] md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-[var(--scoutx-foreground)]">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="#composer">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="#composer">Launch mission</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
