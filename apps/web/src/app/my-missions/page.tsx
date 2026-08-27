export const dynamic = "force-dynamic";

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
  updatedAt: Date;
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
  const activeTab = sp.tab || "req-in-progress";

  const createdMissions = await prisma.mission.findMany({
    where: { requesterId: userId },
    select: {
      id: true,
      title: true,
      status: true,
      budgetCents: true,
      currency: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const participatedMissions = await prisma.mission.findMany({
    where: {
      requesterId: { not: userId },
      OR: [
        { recipients: { some: { userId } } },
        { assignedScout: { userId } },
        { submission: { userId } },
        { evidence: { some: { userId } } },
        { timelineEntries: { some: { actorId: userId } } },
      ],
    },
    select: {
      id: true,
      title: true,
      status: true,
      budgetCents: true,
      currency: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const allItems: MissionGroup[] = [
    ...createdMissions.map((m) => ({ ...m, role: "REQUESTER" as const })),
    ...participatedMissions.map((m) => ({ ...m, role: "WORKER" as const })),
  ];

  const pendingSettlementStatuses = ["COMPLETED_PENDING_SETTLEMENT", "SETTLEMENT_PENDING"];
  const completedStatuses = ["COMPLETED", "REWARDED", "CANCELLED", "EXPIRED", "VOTING_FINALIZED"];
  const draftStatuses = ["DRAFT"];
  const inProgressStatuses = [
    "OPEN",
    "MATCHED",
    "IN_PROGRESS",
    "SUBMITTED",
    "VERIFIED",
    "PENDING_REQUESTER_ACCEPTANCE",
    "DISPUTED",
    "COMMUNITY_VOTING",
  ];

  const reqDrafts = allItems.filter(
    (m) => draftStatuses.includes(m.status) && m.role === "REQUESTER",
  );
  const reqInProgress = allItems.filter(
    (m) => inProgressStatuses.includes(m.status) && m.role === "REQUESTER",
  );
  const reqSettlement = allItems.filter(
    (m) => pendingSettlementStatuses.includes(m.status) && m.role === "REQUESTER",
  );
  const reqCompleted = allItems.filter(
    (m) => completedStatuses.includes(m.status) && m.role === "REQUESTER",
  );

  const workerParticipating = allItems.filter((m) => m.role === "WORKER");
  const workerReceiving = allItems.filter(
    (m) => inProgressStatuses.includes(m.status) && m.role === "WORKER",
  );
  const workerSettlement = allItems.filter(
    (m) => pendingSettlementStatuses.includes(m.status) && m.role === "WORKER",
  );
  const workerCompleted = allItems.filter(
    (m) => completedStatuses.includes(m.status) && m.role === "WORKER",
  );

  let displayList: MissionGroup[] = [];
  if (activeTab === "req-draft" || activeTab === "draft") displayList = reqDrafts;
  else if (
    activeTab === "req-in-progress" ||
    activeTab === "created" ||
    activeTab === "in-progress"
  )
    displayList = reqInProgress;
  else if (activeTab === "req-settlement") displayList = reqSettlement;
  else if (activeTab === "req-completed" || activeTab === "completed" || activeTab === "done")
    displayList = reqCompleted;
  else if (activeTab === "worker-participating" || activeTab === "participating")
    displayList = workerParticipating;
  else if (activeTab === "worker-receiving") displayList = workerReceiving;
  else if (activeTab === "worker-settlement") displayList = workerSettlement;
  else if (activeTab === "worker-completed") displayList = workerCompleted;
  else displayList = reqInProgress;

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

      <div className="mb-2">
        <h2 className="mb-1 px-4 text-sm font-black uppercase text-[var(--scoutx-muted-foreground)]">
          Requester
        </h2>
        <div className="hide-scrollbar flex overflow-x-auto border-b border-[var(--scoutx-border)]">
          <TabLink id="req-draft" label="Drafts" count={reqDrafts.length} />
          <TabLink id="req-in-progress" label="In Progress" count={reqInProgress.length} />
          <TabLink id="req-settlement" label="Awaiting Settlement" count={reqSettlement.length} />
          <TabLink id="req-completed" label="Completed" count={reqCompleted.length} />
        </div>
      </div>

      <div className="mb-6">
        <h2 className="mb-1 mt-4 px-4 text-sm font-black uppercase text-[var(--scoutx-muted-foreground)]">
          Worker
        </h2>
        <div className="hide-scrollbar flex overflow-x-auto border-b border-[var(--scoutx-border)]">
          <TabLink
            id="worker-participating"
            label="Participating"
            count={workerParticipating.length}
          />
          <TabLink id="worker-receiving" label="Receiving Mission" count={workerReceiving.length} />
          <TabLink
            id="worker-settlement"
            label="Awaiting Settlement"
            count={workerSettlement.length}
          />
          <TabLink id="worker-completed" label="Completed" count={workerCompleted.length} />
        </div>
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
                    Last updated {new Date(m.updatedAt).toLocaleDateString()}{" "}
                    {new Date(m.updatedAt).toLocaleTimeString()}
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
