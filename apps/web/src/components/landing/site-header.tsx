"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthHeaderActions } from "@/components/auth/auth-header";
import { BRAND } from "@/lib/branding";
import { NotificationBell } from "@/components/notification-bell";

const navItems = [
  { href: "/missions", label: "Missions", icon: "📌" },
  { href: "/missions/new", label: "Create Mission", icon: "➕" },
  { href: "/scouts", label: "Top Scouters", icon: "🏆" },
  { href: "/market", label: "Market Intelligence", icon: "📊" },
] as const;

export function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-[var(--scoutx-border)]/70 sticky top-0 z-40 border-b bg-[color-mix(in_srgb,var(--scoutx-background)_82%,white)] backdrop-blur-md">
      <div className="section-shell flex h-16 items-center justify-between gap-4">
        <Link
          href="/"
          className="font-display text-xl font-bold tracking-tight text-[var(--scoutx-hero-from)]"
        >
          {BRAND.appName}
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 text-sm text-[var(--scoutx-muted-foreground)] md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-1.5 transition-colors hover:text-[var(--scoutx-foreground)] font-medium"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Auth Actions + Mobile Menu Button */}
        <div className="flex items-center gap-3">
          <NotificationBell />
          <AuthHeaderActions />

          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--scoutx-border)] text-[var(--scoutx-foreground)] md:hidden hover:bg-[var(--scoutx-muted)]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="border-t border-[var(--scoutx-border)] bg-[var(--scoutx-card)] px-4 py-4 md:hidden animate-in slide-in-from-top-2">
          <nav className="flex flex-col gap-3 text-sm">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 font-semibold text-[var(--scoutx-foreground)] hover:bg-[var(--scoutx-muted)]"
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}

