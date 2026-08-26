import type { Metadata } from "next";
import { BRAND } from "@/lib/branding";

export const metadata: Metadata = {
  title: `About ${BRAND.appName} | ${BRAND.fullTagline}`,
  description: BRAND.seo.defaultDescription,
};

export default function AboutPage() {
  return (
    <div className="container max-w-4xl space-y-8 px-4 py-12">
      <div className="space-y-4">
        <h1 className="text-3xl font-extrabold tracking-tight">About {BRAND.appName}</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {BRAND.appName} ({BRAND.tagline}) bridges the gap between field verification needs and
          trusted local scouts worldwide. Powered by instant coin escrows, tamper-proof timeline
          logging, and automated reputation verification.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 border-t pt-6 md:grid-cols-3">
        <div className="space-y-2">
          <h3 className="text-base font-bold">1. Verified Scouts</h3>
          <p className="text-muted-foreground text-xs">
            Scouts undergo automated trust scoring and category validation before taking field
            assignments.
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-bold">2. Coin Escrow</h3>
          <p className="text-muted-foreground text-xs">
            Bounties are locked securely into smart escrow and released instantly upon proof
            verification.
          </p>
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-bold">3. Realtime Evidence</h3>
          <p className="text-muted-foreground text-xs">
            Field notes, photos, and video media are streamed live with geographical coordinate
            signatures.
          </p>
        </div>
      </div>
    </div>
  );
}
