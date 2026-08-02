import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | ScoutX",
  description: "Find answers to common questions about bounties, escrows, and scout verification.",
};

const FAQS = [
  {
    q: "How does coin escrow work?",
    a: "When a requester creates a mission, the bounty amount is deducted and locked into escrow. Once evidence is submitted and verified, coins are automatically transferred to the scout.",
  },
  {
    q: "How are scouts verified?",
    a: "Scouts start at Bronze rank and advance to Legend status based on submission accuracy, average response speed, and peer verification ratings.",
  },
  {
    q: "What types of investigations can be posted?",
    a: "Property verification, missing pets, business due diligence, neighborhood intelligence, open-source verification, and vehicle checks.",
  },
];

export default function FAQPage() {
  return (
    <div className="container max-w-3xl space-y-8 px-4 py-12">
      <h1 className="text-3xl font-extrabold tracking-tight">Frequently Asked Questions</h1>
      <div className="space-y-6">
        {FAQS.map((faq, i) => (
          <div key={i} className="bg-card space-y-2 rounded-xl border p-5">
            <h3 className="text-foreground text-sm font-bold">{faq.q}</h3>
            <p className="text-muted-foreground text-xs leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
