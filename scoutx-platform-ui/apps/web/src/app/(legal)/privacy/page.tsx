import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | ScoutX",
  description: "Learn how ScoutX collects, uses, and protects your personal data.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="container max-w-4xl space-y-6 px-4 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight">Privacy Policy</h1>
      <p className="text-muted-foreground text-sm">Last updated: July 30, 2026</p>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-bold">1. Information We Collect</h2>
        <p>
          We collect personal information necessary to deliver crowd-sourced investigative
          operations, verify scout identities, and facilitate escrowed coin transactions.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-bold">2. Data Security & Storage</h2>
        <p>
          All evidence media and communication logs are encrypted in transit and at rest using
          enterprise security protocols and localized regional storage boundaries.
        </p>
      </section>
    </div>
  );
}
