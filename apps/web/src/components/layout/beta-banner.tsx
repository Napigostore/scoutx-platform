"use client";

import { useState } from "react";
import Link from "next/link";

export function BetaBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative flex items-center justify-center gap-2 bg-[var(--scoutx-hero-from)] px-4 py-2 text-center text-xs font-semibold text-white">
      <span>⚡ FIWOKAN Beta — Zero platform fee during Beta release</span>
      <Link href="/faq" className="ml-1 font-bold underline hover:text-white/90">
        Details
      </Link>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss banner"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold text-white/80 hover:text-white"
      >
        ✕
      </button>
    </div>
  );
}
