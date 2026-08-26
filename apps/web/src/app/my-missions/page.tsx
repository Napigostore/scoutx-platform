import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@scoutx/application";

type MissionGroup = {
  id: string;
  title: string;
  status: string;
  budgetCents: number | null;
  currency: string | null;
  createdAt: Date;
  role: "REQUESTER" | "WORKER";
};

export default async function MyMissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }
  const userId = session.user.id;
  const sp = await searchParams;
  const activeTab = sp.tab || "in-progress";

  // Fetch created missions (Requester)
  const createdMissions = await prisma.mission.findMany({
    where: { requesterId: userId },
    select: {
      id: true,
      title: true,
      status: true,
      budgetCents: true,
      currency: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch participated missions (Worker)
  const participatedMissions = await prisma.mission.findMany({
    where: {
      requesterId: { not: userId },
      OR: [
        { recipients: { some: { userId } } },
        { assignedScout: { userId } },
        { submission: { userId } },
        { evidence: { some: { userId } } },
      ],
    },
    select: {
      id: true,
      title: true,
      status: true,
      budgetCents: true,
      currency: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const allItems: MissionGroup[] = [
    ...createdMissions.map((m) => ({ ...m, role: "REQUESTER" as const })),
    ...participatedMissions.map((m) => ({ ...m, role: "WORKER" as const })),
  ];

  const draftStatuses = ["DRAFT"];
  const doneStatuses = [
    "COMPLETED",
    "REWARDED",
    "VOTING_FINALIZED",
    "SETTLEMENT_PENDING",
    "COMPLETED_PENDING_SETTLEMENT",
    "CANCELLED",
    "EXPIRED",
  ];

  const drafts = allItems.filter((m) => draftStatuses.includes(m.status));
  const done = allItems.filter((m) => doneStatuses.includes(m.status));
  const allInProgress = allItems.filter(
    (m) => !draftStatuses.includes(m.status) && !doneStatuses.includes(m.status),
  );
  const inProgress = allInProgress.filter((m) => m.role === "REQUESTER");
  const receiving = allInProgress.filter((m) => m.role === "WORKER");

  let displayList = inProgress;
  if (activeTab === "draft") displayList = drafts;
  else if (activeTab === "done") displayList = done;
  else if (activeTab === "receiving") displayList = receiving;

  const TabLink = ({ id, label, count }: { id: string; label: string; count: number }) => {
    const isActive = activeTab === id;
    return (
      <Link
        href={`/my-missions?tab=${id}`}
        className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-bold transition-colors ${
          isActive
            ? "border-[var(--scoutx-primary)] text-[var(--scoutx-foreground)]"
            : "border-transparent text-[var(--scoutx-muted-foreground)] hover:text-[var(--scoutx-foreground)]"
        }`}
      >
        {label} ({count})
      </Link>
    );
  };

  return (
    <div className="section-shell mx-auto min-h-[60vh] max-w-5xl py-8">
      <h1 className="mb-6 text-3xl font-black text-[var(--scoutx-foreground)]">My Missions</h1>

      <div className="mb-6 flex overflow-x-auto border-b border-[var(--scoutx-border)]">
        <TabLink id="draft" label="Drafts" count={drafts.length} />
        <TabLink id="in-progress" label="In Progress" count={inProgress.length} />
        <TabLink id="receiving" label="Receiving Mission" count={receiving.length} />
        <TabLink id="done" label="Done" count={done.length} />
      </div>

      <div className="space-y-4">
        {displayList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--scoutx-border)] py-12 text-center text-[var(--scoutx-muted-foreground)]">
            No missions found in this category.
          </div>
        ) : (
          displayList.map((m) => (
            <Link
              key={m.id}
              href={`/missions/${m.id}`}
              className="block rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-5 shadow-sm transition-all hover:border-[var(--scoutx-primary)]"
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${m.role === "REQUESTER" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"}`}
                    >
                      {m.role === "REQUESTER" ? "Requester" : "Worker"}
                    </span>
                    <span className="rounded-full border border-[var(--scoutx-border)] bg-[var(--scoutx-muted)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--scoutx-muted-foreground)]">
                      {m.status.replace(/_/g, " ")}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[var(--scoutx-foreground)]">{m.title}</h3>
                  <div className="mt-1 text-xs text-[var(--scoutx-muted-foreground)]">
                    Created {new Date(m.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-black text-[var(--scoutx-primary)]">
                    {formatCurrency(m.budgetCents || 0, m.currency || "VND")}
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
