import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | ScoutX",
  description: "Terms and conditions governing the use of the ScoutX platform.",
};

export default function TermsPage() {
  return (
    <div className="container max-w-4xl space-y-6 px-4 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight">Terms of Service</h1>
      <p className="text-muted-foreground text-sm">Last updated: July 30, 2026</p>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-bold">1. Escrow & Bounty Rules</h2>
        <p>
          Requesters lock coin bounties into escrow prior to mission publishing. Escrowed coins are
          released to scouts upon evidence verification.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-bold">2. Scout Code of Conduct</h2>
        <p>
          Scouts agree to obey all local, state, and federal laws during field activities.
          Trespassing, harassment, or illegal wiretapping is strictly prohibited.
        </p>
      </section>
    </div>
  );
}
