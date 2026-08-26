import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join Public Beta Waitlist | ScoutX",
  description: "Get early access to ScoutX crowd-sourced investigation platform.",
};

export default function WaitlistPage() {
  return (
    <div className="container max-w-xl space-y-6 px-4 py-16 text-center">
      <div className="bg-primary/10 text-primary inline-block rounded-full px-3 py-1 text-xs font-semibold">
        Public Beta Opening Soon
      </div>
      <h1 className="text-4xl font-extrabold tracking-tight">Join the ScoutX Beta</h1>
      <p className="text-muted-foreground text-sm">
        Be among the first requesters and scouts to experience decentralized field investigation,
        real-time proof, and instant escrowed rewards.
      </p>

      <form className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row">
        <input
          type="email"
          placeholder="Enter your work email"
          required
          className="bg-background focus:outline-hidden focus:ring-primary flex-1 rounded-lg border px-4 py-2 text-xs focus:ring-2"
        />
        <button
          type="submit"
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-5 py-2 text-xs font-semibold transition-colors"
        >
          Request Invite
        </button>
      </form>

      <p className="text-muted-foreground text-[10px]">
        Priority invites will be sent to verified scouts and organization leaders.
      </p>
    </div>
  );
}
