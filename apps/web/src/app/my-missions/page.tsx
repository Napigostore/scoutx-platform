export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@scoutx/application";

type MissionItem = {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  urgency: string;
  budgetCents: number | null;
  currency: string | null;
  winnerId: string | null;
  requesterId: string;
  createdAt: Date;
  updatedAt: Date;
  settlementStartedAt: Date | null;
  rewardReleasedAt: Date | null;
  locationName: string | null;
  locationCity: string | null;
  locationCountry: string | null;
  role: "REQUESTER" | "WORKER";
  pendingRewardRequestsCount: number;
  workerRewardRequestStatus: string | null;
  evidenceCount: number;
  recipientsCount: number;
};

function getStatusBadge(
  status: string,
  role: "REQUESTER" | "WORKER",
  workerRewardStatus: string | null,
  winnerId: string | null,
  currentUserId: string,
) {
  const isWinner = winnerId === currentUserId;

  if (role === "WORKER") {
    if (
      status === "REWARDED" ||
      (status === "COMPLETED" && isWinner) ||
      workerRewardStatus === "APPROVED"
    ) {
      return {
        label: "Đã nhận thưởng (Rewarded)",
        color:
          "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
        icon: "🏆",
        note: "Thưởng đã chuyển vào ví của bạn",
      };
    }
    if (status === "COMPLETED_PENDING_SETTLEMENT" || status === "SETTLEMENT_PENDING") {
      return {
        label: "Chờ quyết toán (Settlement)",
        color:
          "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
        icon: "⏳",
        note: "Đã được duyệt, đang giải ngân coin",
      };
    }
    if (status === "PENDING_REQUESTER_ACCEPTANCE" || workerRewardStatus === "PENDING") {
      return {
        label: "Chờ người giao duyệt (Under Review)",
        color:
          "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
        icon: "⏱️",
        note: "Đã gửi yêu cầu nhận thưởng",
      };
    }
    if (status === "SUBMITTED" || status === "VERIFIED") {
      return {
        label: "Đã nộp bằng chứng (Submitted)",
        color:
          "bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800",
        icon: "📸",
        note: "Bằng chứng đã tải lên thành công",
      };
    }
    if (status === "IN_PROGRESS" || status === "MATCHED") {
      return {
        label: "Đang thực hiện (In Progress)",
        color:
          "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
        icon: "⚡",
        note: "Nhiệm vụ đang diễn ra",
      };
    }
    if (status === "DISPUTED" || status === "COMMUNITY_VOTING") {
      return {
        label: "Đang khiếu nại (Disputed)",
        color:
          "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
        icon: "⚠️",
        note: "Đang trong quá trình giải quyết tranh chấp",
      };
    }
    if (status === "CANCELLED" || status === "REFUNDED" || status === "EXPIRED") {
      return {
        label: status === "REFUNDED" ? "Đã hoàn tiền" : status === "EXPIRED" ? "Hết hạn" : "Đã hủy",
        color:
          "bg-zinc-100 text-zinc-800 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
        icon: "✕",
        note: "Nhiệm vụ đã kết thúc",
      };
    }
    return {
      label: status.replace(/_/g, " "),
      color:
        "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
      icon: "📌",
      note: "Nhiệm vụ khả dụng",
    };
  }

  // Role: REQUESTER
  if (status === "PENDING_REQUESTER_ACCEPTANCE") {
    return {
      label: "Cần duyệt trả thưởng (Action Required)",
      color:
        "bg-orange-100 text-orange-800 border-orange-400 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-700 animate-pulse",
      icon: "🔔",
      note: "Worker đã gửi yêu cầu nhận thưởng",
    };
  }
  if (status === "COMPLETED_PENDING_SETTLEMENT" || status === "SETTLEMENT_PENDING") {
    return {
      label: "Đang quyết toán (Settlement)",
      color:
        "bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
      icon: "⏳",
      note: "Đã duyệt trả thưởng, đang giải ngân",
    };
  }
  if (status === "REWARDED" || status === "COMPLETED") {
    return {
      label: "Đã hoàn thành & Trả thưởng (Completed)",
      color:
        "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
      icon: "✅",
      note: "Nhiệm vụ đã hoàn tất thành công",
    };
  }
  if (status === "DRAFT") {
    return {
      label: "Bản nháp (Draft)",
      color:
        "bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
      icon: "📝",
      note: "Chưa xuất bản",
    };
  }
  if (status === "OPEN") {
    return {
      label: "Đang mở tìm người làm (Open)",
      color:
        "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
      icon: "🌐",
      note: "Đang chờ worker nhận nhiệm vụ",
    };
  }
  if (
    status === "MATCHED" ||
    status === "IN_PROGRESS" ||
    status === "SUBMITTED" ||
    status === "VERIFIED"
  ) {
    return {
      label: status === "SUBMITTED" ? "Worker đã nộp bằng chứng" : "Đang thực hiện (In Progress)",
      color:
        "bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800",
      icon: "⚡",
      note: "Worker đang tiến hành công việc",
    };
  }
  if (status === "DISPUTED" || status === "COMMUNITY_VOTING" || status === "VOTING_FINALIZED") {
    return {
      label: "Đang khiếu nại (Disputed)",
      color:
        "bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800",
      icon: "⚠️",
      note: "Đang xử lý tranh chấp kết quả",
    };
  }
  if (status === "CANCELLED" || status === "REFUNDED" || status === "EXPIRED") {
    return {
      label: status === "REFUNDED" ? "Đã hoàn tiền" : status === "EXPIRED" ? "Hết hạn" : "Đã hủy",
      color:
        "bg-zinc-100 text-zinc-800 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
      icon: "✕",
      note: "Nhiệm vụ đã hủy hoặc hoàn tiền",
    };
  }
  return {
    label: status.replace(/_/g, " "),
    color:
      "bg-zinc-100 text-zinc-800 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700",
    icon: "📌",
    note: "",
  };
}

export default async function MyMissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; role?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  let currentUserId = session.user.id;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    currentUserId,
  );
  let dbUser = isUuid ? await prisma.user.findUnique({ where: { id: currentUserId } }) : null;
  if (!dbUser && session.user.email) {
    dbUser = await prisma.user.findUnique({ where: { email: session.user.email } });
  }
  if (dbUser) {
    currentUserId = dbUser.id;
  }

  const scoutProfile = await prisma.scoutProfile.findFirst({
    where: { userId: currentUserId },
    select: { id: true },
  });

  const [createdMissions, participatedMissions] = await Promise.all([
    prisma.mission.findMany({
      where: { requesterId: currentUserId },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        status: true,
        urgency: true,
        budgetCents: true,
        currency: true,
        winnerId: true,
        requesterId: true,
        createdAt: true,
        updatedAt: true,
        settlementStartedAt: true,
        rewardReleasedAt: true,
        location: {
          select: {
            name: true,
            city: true,
            country: true,
          },
        },
        rewardRequests: {
          where: { status: "PENDING" },
          select: {
            id: true,
            userId: true,
            status: true,
          },
        },
        _count: {
          select: {
            evidence: true,
            recipients: true,
            rewardRequests: true,
            surveySubmissions: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.mission.findMany({
      where: {
        requesterId: { not: currentUserId },
        OR: [
          { winnerId: currentUserId },
          { recipients: { some: { userId: currentUserId } } },
          ...(scoutProfile ? [{ assignedScoutId: scoutProfile.id }] : []),
          { assignedScout: { userId: currentUserId } },
          { submission: { userId: currentUserId } },
          { evidence: { some: { userId: currentUserId } } },
          { rewardRequests: { some: { userId: currentUserId } } },
          { surveyParticipants: { some: { userId: currentUserId } } },
          { timelineEntries: { some: { actorId: currentUserId } } },
          { coinLedgers: { some: { userId: currentUserId } } },
        ],
      },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        status: true,
        urgency: true,
        budgetCents: true,
        currency: true,
        winnerId: true,
        requesterId: true,
        createdAt: true,
        updatedAt: true,
        settlementStartedAt: true,
        rewardReleasedAt: true,
        location: {
          select: {
            name: true,
            city: true,
            country: true,
          },
        },
        rewardRequests: {
          where: { userId: currentUserId },
          select: {
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            evidence: true,
            recipients: true,
            rewardRequests: true,
            surveySubmissions: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const allItems: MissionItem[] = [
    ...createdMissions.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      category: m.category,
      status: m.status,
      urgency: m.urgency,
      budgetCents: m.budgetCents,
      currency: m.currency,
      winnerId: m.winnerId,
      requesterId: m.requesterId,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      settlementStartedAt: m.settlementStartedAt,
      rewardReleasedAt: m.rewardReleasedAt,
      locationName: m.location?.name ?? null,
      locationCity: m.location?.city ?? null,
      locationCountry: m.location?.country ?? null,
      role: "REQUESTER" as const,
      pendingRewardRequestsCount: m.rewardRequests.length,
      workerRewardRequestStatus: null,
      evidenceCount: m._count.evidence,
      recipientsCount: m._count.recipients,
    })),
    ...participatedMissions.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      category: m.category,
      status: m.status,
      urgency: m.urgency,
      budgetCents: m.budgetCents,
      currency: m.currency,
      winnerId: m.winnerId,
      requesterId: m.requesterId,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      settlementStartedAt: m.settlementStartedAt,
      rewardReleasedAt: m.rewardReleasedAt,
      locationName: m.location?.name ?? null,
      locationCity: m.location?.city ?? null,
      locationCountry: m.location?.country ?? null,
      role: "WORKER" as const,
      pendingRewardRequestsCount: 0,
      workerRewardRequestStatus: m.rewardRequests[0]?.status ?? null,
      evidenceCount: m._count.evidence,
      recipientsCount: m._count.recipients,
    })),
  ].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const sp = await searchParams;
  const activeRole = sp.role || "all";
  const rawTab = sp.tab || "all";

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
  const pendingSettlementStatuses = [
    "COMPLETED_PENDING_SETTLEMENT",
    "SETTLEMENT_PENDING",
    "VOTING_FINALIZED",
  ];
  const completedStatuses = ["COMPLETED", "REWARDED", "CANCELLED", "REFUNDED", "EXPIRED"];
  const draftStatuses = ["DRAFT"];

  // Normalize active tab & role
  let roleFiltered = allItems;
  if (activeRole === "requester") {
    roleFiltered = allItems.filter((m) => m.role === "REQUESTER");
  } else if (activeRole === "worker") {
    roleFiltered = allItems.filter((m) => m.role === "WORKER");
  }

  // Handle specific tab filters
  let displayList = roleFiltered;
  if (rawTab === "draft" || rawTab === "req-draft") {
    displayList = roleFiltered.filter((m) => draftStatuses.includes(m.status));
  } else if (
    rawTab === "in-progress" ||
    rawTab === "req-in-progress" ||
    rawTab === "worker-receiving" ||
    rawTab === "receiving"
  ) {
    displayList = roleFiltered.filter((m) => inProgressStatuses.includes(m.status));
  } else if (
    rawTab === "settlement" ||
    rawTab === "req-settlement" ||
    rawTab === "worker-settlement"
  ) {
    displayList = roleFiltered.filter((m) => pendingSettlementStatuses.includes(m.status));
  } else if (
    rawTab === "completed" ||
    rawTab === "req-completed" ||
    rawTab === "worker-completed" ||
    rawTab === "done"
  ) {
    displayList = roleFiltered.filter((m) => completedStatuses.includes(m.status));
  } else {
    // "all" tab
    displayList = roleFiltered;
  }

  // Summary counts
  const totalCount = allItems.length;
  const requesterCount = createdMissions.length;
  const workerCount = participatedMissions.length;

  const inProgressCount = roleFiltered.filter((m) => inProgressStatuses.includes(m.status)).length;
  const settlementCount = roleFiltered.filter((m) =>
    pendingSettlementStatuses.includes(m.status),
  ).length;
  const completedCount = roleFiltered.filter((m) => completedStatuses.includes(m.status)).length;
  const draftCount = roleFiltered.filter((m) => draftStatuses.includes(m.status)).length;

  const getTabUrl = (tabName: string) => {
    const params = new URLSearchParams();
    if (activeRole !== "all") params.set("role", activeRole);
    if (tabName !== "all") params.set("tab", tabName);
    const qs = params.toString();
    return `/my-missions${qs ? `?${qs}` : ""}`;
  };

  const getRoleUrl = (roleName: string) => {
    const params = new URLSearchParams();
    if (roleName !== "all") params.set("role", roleName);
    if (rawTab !== "all") params.set("tab", rawTab);
    const qs = params.toString();
    return `/my-missions${qs ? `?${qs}` : ""}`;
  };

  return (
    <div className="section-shell mx-auto min-h-[70vh] max-w-6xl py-8">
      {/* Header & Quick Action */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-[var(--scoutx-foreground)]">
            My Missions (Nhiệm vụ của tôi)
          </h1>
          <p className="mt-1 text-sm text-[var(--scoutx-muted-foreground)]">
            Theo dõi thời gian thực tiến độ, trạng thái nghiệm thu và trả thưởng cho cả vai trò
            Người giao (Requester) và Người làm (Worker).
          </p>
        </div>
        <Link
          href="/missions/new"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--scoutx-primary)] px-4 py-2.5 text-sm font-bold text-white shadow-md transition-transform hover:scale-105"
        >
          <span>➕</span>
          <span>Tạo nhiệm vụ mới</span>
        </Link>
      </div>

      {/* Overview Stat Cards */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--scoutx-muted-foreground)]">
            Tổng nhiệm vụ
          </p>
          <p className="font-display mt-1 text-2xl font-black text-[var(--scoutx-foreground)]">
            {totalCount}
          </p>
          <p className="text-[11px] text-[var(--scoutx-muted-foreground)]">
            {requesterCount} đã giao · {workerCount} đã nhận
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
            Đang thực hiện
          </p>
          <p className="font-display mt-1 text-2xl font-black text-amber-600 dark:text-amber-400">
            {inProgressCount}
          </p>
          <p className="text-[11px] text-[var(--scoutx-muted-foreground)]">
            Đang hoạt động trên thực địa
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            Chờ duyệt & Quyết toán
          </p>
          <p className="font-display mt-1 text-2xl font-black text-purple-600 dark:text-purple-400">
            {settlementCount}
          </p>
          <p className="text-[11px] text-[var(--scoutx-muted-foreground)]">
            Chờ duyệt hoặc giải ngân coin
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            Hoàn tất & Đã trả coin
          </p>
          <p className="font-display mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {completedCount}
          </p>
          <p className="text-[11px] text-[var(--scoutx-muted-foreground)]">Nhiệm vụ thành công</p>
        </div>
      </div>

      {/* Role Selector Tabs */}
      <div className="mb-4 flex items-center gap-2 border-b border-[var(--scoutx-border)] pb-2">
        <span className="mr-2 text-xs font-bold uppercase tracking-wider text-[var(--scoutx-muted-foreground)]">
          Vai trò:
        </span>
        <Link
          href={getRoleUrl("all")}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
            activeRole === "all"
              ? "bg-[var(--scoutx-foreground)] text-[var(--scoutx-background)] shadow-sm"
              : "text-[var(--scoutx-muted-foreground)] hover:bg-[var(--scoutx-muted)]"
          }`}
        >
          Tất cả ({totalCount})
        </Link>
        <Link
          href={getRoleUrl("requester")}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
            activeRole === "requester"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-[var(--scoutx-muted-foreground)] hover:bg-[var(--scoutx-muted)]"
          }`}
        >
          Người giao việc ({requesterCount})
        </Link>
        <Link
          href={getRoleUrl("worker")}
          className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
            activeRole === "worker"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-[var(--scoutx-muted-foreground)] hover:bg-[var(--scoutx-muted)]"
          }`}
        >
          Người thực hiện ({workerCount})
        </Link>
      </div>

      {/* Status Filter Tabs */}
      <div className="hide-scrollbar mb-6 flex gap-2 overflow-x-auto pb-1 text-sm">
        <Link
          href={getTabUrl("all")}
          className={`whitespace-nowrap rounded-xl px-4 py-2 font-bold transition-all ${
            rawTab === "all"
              ? "bg-[var(--scoutx-primary)] text-white shadow-sm"
              : "border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] text-[var(--scoutx-muted-foreground)] hover:text-[var(--scoutx-foreground)]"
          }`}
        >
          Tất cả trạng thái ({roleFiltered.length})
        </Link>

        <Link
          href={getTabUrl("in-progress")}
          className={`whitespace-nowrap rounded-xl px-4 py-2 font-bold transition-all ${
            rawTab === "in-progress" ||
            rawTab === "req-in-progress" ||
            rawTab === "worker-receiving"
              ? "bg-[var(--scoutx-primary)] text-white shadow-sm"
              : "border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] text-[var(--scoutx-muted-foreground)] hover:text-[var(--scoutx-foreground)]"
          }`}
        >
          Đang thực hiện ({inProgressCount})
        </Link>

        <Link
          href={getTabUrl("settlement")}
          className={`whitespace-nowrap rounded-xl px-4 py-2 font-bold transition-all ${
            rawTab === "settlement" || rawTab === "req-settlement" || rawTab === "worker-settlement"
              ? "bg-[var(--scoutx-primary)] text-white shadow-sm"
              : "border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] text-[var(--scoutx-muted-foreground)] hover:text-[var(--scoutx-foreground)]"
          }`}
        >
          Chờ duyệt & Quyết toán ({settlementCount})
        </Link>

        <Link
          href={getTabUrl("completed")}
          className={`whitespace-nowrap rounded-xl px-4 py-2 font-bold transition-all ${
            rawTab === "completed" || rawTab === "req-completed" || rawTab === "worker-completed"
              ? "bg-[var(--scoutx-primary)] text-white shadow-sm"
              : "border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] text-[var(--scoutx-muted-foreground)] hover:text-[var(--scoutx-foreground)]"
          }`}
        >
          Đã hoàn thành ({completedCount})
        </Link>

        {(activeRole === "all" || activeRole === "requester") && (
          <Link
            href={getTabUrl("draft")}
            className={`whitespace-nowrap rounded-xl px-4 py-2 font-bold transition-all ${
              rawTab === "draft" || rawTab === "req-draft"
                ? "bg-[var(--scoutx-primary)] text-white shadow-sm"
                : "border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] text-[var(--scoutx-muted-foreground)] hover:text-[var(--scoutx-foreground)]"
            }`}
          >
            Bản nháp ({draftCount})
          </Link>
        )}
      </div>

      {/* Mission List */}
      <div className="space-y-4">
        {displayList.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--scoutx-border)] py-16 text-center">
            <span className="mb-3 block text-4xl">📭</span>
            <h3 className="text-lg font-bold text-[var(--scoutx-foreground)]">
              Chưa có nhiệm vụ nào trong mục này
            </h3>
            <p className="mx-auto mt-1 max-w-md text-sm text-[var(--scoutx-muted-foreground)]">
              {activeRole === "requester"
                ? "Bạn chưa có nhiệm vụ nào với vai trò Người giao việc trong trạng thái đã chọn."
                : activeRole === "worker"
                  ? "Bạn chưa có nhiệm vụ nào nhận thực hiện trong trạng thái đã chọn. Hãy duyệt danh sách nhiệm vụ đang mở để tham gia!"
                  : "Không tìm thấy nhiệm vụ nào phù hợp với bộ lọc hiện tại."}
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Link
                href="/missions"
                className="rounded-xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] px-4 py-2 text-xs font-bold text-[var(--scoutx-foreground)] hover:bg-[var(--scoutx-muted)]"
              >
                Khám phá nhiệm vụ mở
              </Link>
              <Link
                href="/missions/new"
                className="rounded-xl bg-[var(--scoutx-primary)] px-4 py-2 text-xs font-bold text-white shadow-sm"
              >
                Tạo nhiệm vụ ngay
              </Link>
            </div>
          </div>
        ) : (
          displayList.map((m) => {
            const badge = getStatusBadge(
              m.status,
              m.role,
              m.workerRewardRequestStatus,
              m.winnerId,
              currentUserId,
            );

            return (
              <div
                key={`${m.role}-${m.id}`}
                className="hover:border-[var(--scoutx-primary)]/70 group relative rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-5 shadow-sm transition-all hover:shadow-md"
              >
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                  <div className="flex-1 space-y-2">
                    {/* Role & Status Header */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wide ${
                          m.role === "REQUESTER"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300"
                            : "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                        }`}
                      >
                        {m.role === "REQUESTER"
                          ? "👤 Người giao (Requester)"
                          : "🛠️ Người làm (Worker)"}
                      </span>

                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${badge.color}`}
                      >
                        <span>{badge.icon}</span>
                        <span>{badge.label}</span>
                      </span>

                      {m.role === "REQUESTER" && m.pendingRewardRequestsCount > 0 && (
                        <span className="inline-flex animate-pulse items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-[10px] font-black text-red-700 dark:bg-red-950/60 dark:text-red-300">
                          ⚠️ {m.pendingRewardRequestsCount} yêu cầu trả thưởng cần duyệt
                        </span>
                      )}

                      {m.role === "WORKER" && m.workerRewardRequestStatus === "PENDING" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                          ⏳ Đã yêu cầu duyệt coin
                        </span>
                      )}

                      {m.locationCity && (
                        <span className="text-xs text-[var(--scoutx-muted-foreground)]">
                          📍 {m.locationCity}
                          {m.locationCountry ? `, ${m.locationCountry}` : ""}
                        </span>
                      )}
                    </div>

                    {/* Mission Title */}
                    <Link
                      href={`/missions/${m.id}`}
                      className="font-display block text-lg font-bold text-[var(--scoutx-foreground)] transition-colors hover:text-[var(--scoutx-primary)]"
                    >
                      {m.title}
                    </Link>

                    {/* Subtitle / Note */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--scoutx-muted-foreground)]">
                      {badge.note && (
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {badge.note}
                        </span>
                      )}
                      <span>·</span>
                      <span>
                        Cập nhật: {new Date(m.updatedAt).toLocaleDateString("vi-VN")}{" "}
                        {new Date(m.updatedAt).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {m.evidenceCount > 0 && (
                        <>
                          <span>·</span>
                          <span>📸 {m.evidenceCount} bằng chứng</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Reward & Action */}
                  <div className="flex shrink-0 items-center justify-between gap-2 md:flex-col md:items-end">
                    <div className="text-xl font-black text-[var(--scoutx-primary)]">
                      {formatCurrency(m.budgetCents || 0, m.currency || "VND")}
                    </div>

                    <div className="flex items-center gap-2">
                      {m.role === "REQUESTER" &&
                      (m.status === "PENDING_REQUESTER_ACCEPTANCE" ||
                        m.pendingRewardRequestsCount > 0) ? (
                        <Link
                          href={`/missions/${m.id}`}
                          className="rounded-xl bg-orange-500 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-transform hover:scale-105"
                        >
                          Duyệt trả thưởng 👉
                        </Link>
                      ) : m.role === "WORKER" &&
                        (m.status === "IN_PROGRESS" || m.status === "MATCHED") ? (
                        <Link
                          href={`/missions/${m.id}`}
                          className="rounded-xl bg-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-transform hover:scale-105"
                        >
                          Tải bằng chứng 📸
                        </Link>
                      ) : (
                        <Link
                          href={`/missions/${m.id}`}
                          className="rounded-xl border border-[var(--scoutx-border)] bg-[var(--scoutx-muted)] px-3.5 py-1.5 text-xs font-bold text-[var(--scoutx-foreground)] transition-colors hover:bg-[var(--scoutx-border)]"
                        >
                          Chi tiết nhiệm vụ ↗
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
