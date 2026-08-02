"use client";

import { useState } from "react";
import Link from "next/link";

export function BetaBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-primary/90 text-primary-foreground relative flex items-center justify-center gap-2 px-4 py-2 text-center text-xs font-semibold">
      <span>🚀 ScoutX is currently in Public Beta. Welcome early requesters and field scouts!</span>
      <Link href="/waitlist" className="ml-1 font-bold underline hover:text-white">
        Learn More
      </Link>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss banner"
        className="text-primary-foreground/80 hover:text-primary-foreground absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold"
      >
        ✕
      </button>
    </div>
  );
}
