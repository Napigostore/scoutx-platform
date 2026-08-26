"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, Badge, cn } from "@scoutx/ui";
import { useRealtimeEvent } from "../../providers/realtime-event-provider";

/* ─── Types ─── */

export type TransactionType =
  "Reward" | "Escrow Deposit" | "Escrow Release" | "Refund" | "Purchase" | "Adjustment";

export interface WalletTransaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  timestamp: string;
  missionId?: string;
  status: "completed" | "pending" | "failed";
}

export interface EscrowItem {
  id: string;
  missionTitle: string;
  missionId: string;
  lockedAmount: number;
  unlockCondition: string;
  remainingTime: string;
  status: "locked" | "releasing" | "released" | "refunded";
}

export interface WalletData {
  availableCoins: number;
  escrowCoins: number;
  lifetimeEarned: number;
  lifetimeSpent: number;
  pendingRewards: number;
  transactions: WalletTransaction[];
  escrows: EscrowItem[];
}

interface CoinWalletDashboardProps {
  initialData: WalletData;
  className?: string;
}

type FilterType = "All" | "Rewards" | "Escrow" | "Refunds" | "Purchases";

/* ─── CSV Exporter ─── */

function exportTransactionsCSV(transactions: WalletTransaction[]) {
  if (typeof window === "undefined") return;
  const headers = [
    "Transaction ID",
    "Type",
    "Amount",
    "Description",
    "Timestamp",
    "Status",
    "Mission ID",
  ];
  const rows = transactions.map((t) => [
    t.id,
    t.type,
    t.amount.toString(),
    `"${t.description.replace(/"/g, '""')}"`,
    t.timestamp,
    t.status,
    t.missionId || "",
  ]);
  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `coin_transactions_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ─── Payment Flow Steps ─── */

const PAYMENT_FLOW_STEPS = [
  { step: 1, label: "Requester", desc: "Initiate" },
  { step: 2, label: "Deposit Coins", desc: "Lock Escrow" },
  { step: 3, label: "Mission Active", desc: "In Progress" },
  { step: 4, label: "Evidence Verified", desc: "Proof Approved" },
  { step: 5, label: "Coins Released", desc: "Payout Sent" },
  { step: 6, label: "Wallet Updated", desc: "Balance Settled" },
];

/* ─── Component ─── */

export function CoinWalletDashboard({ initialData, className }: CoinWalletDashboardProps) {
  const [data, setData] = useState<WalletData>(initialData);
  const [filter, setFilter] = useState<FilterType>("All");
  const [activeFlowStep, setActiveFlowStep] = useState<number>(3); // Default step active

  // Realtime Coin Engine updates
  useRealtimeEvent("*", (event) => {
    switch (event.type) {
      case "coin.updated":
        if (typeof event.currentBounty === "number" || typeof event.amount === "number") {
          const delta = event.amount ?? event.currentBounty ?? 0;
          setData((prev) => ({
            ...prev,
            availableCoins: Math.max(0, prev.availableCoins + delta),
            lifetimeEarned: delta > 0 ? prev.lifetimeEarned + delta : prev.lifetimeEarned,
          }));
        }
        break;

      case "coin.released":
        setData((prev) => {
          const releasedAmt = event.amount;
          const newTx: WalletTransaction = {
            id: `tx_${Date.now()}`,
            type: "Escrow Release",
            amount: releasedAmt,
            description: `Coins released: ${event.reason || "Escrow unlocked"}`,
            timestamp: new Date().toISOString(),
            missionId: event.investigationId,
            status: "completed",
          };
          return {
            ...prev,
            availableCoins: prev.availableCoins + releasedAmt,
            escrowCoins: Math.max(0, prev.escrowCoins - releasedAmt),
            lifetimeEarned: prev.lifetimeEarned + releasedAmt,
            transactions: [newTx, ...prev.transactions],
            escrows: prev.escrows.map((e) =>
              e.missionId === event.investigationId
                ? { ...e, status: "released", lockedAmount: 0 }
                : e,
            ),
          };
        });
        setActiveFlowStep(6); // Advances flow to Wallet Updated
        break;

      case "evidence.verified":
        setActiveFlowStep(4); // Advances flow to Evidence Verified
        break;
    }
  });

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return data.transactions.filter((tx) => {
      if (filter === "All") return true;
      if (filter === "Rewards") return tx.type === "Reward";
      if (filter === "Escrow") return tx.type === "Escrow Deposit" || tx.type === "Escrow Release";
      if (filter === "Refunds") return tx.type === "Refund";
      if (filter === "Purchases") return tx.type === "Purchase";
      return true;
    });
  }, [data.transactions, filter]);

  return (
    <div className={cn("mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6", className)}>
      {/* ─── Header & CSV Export ─── */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Coin Wallet & Escrow</h2>
          <p className="text-muted-foreground mt-0.5 text-sm">
            Manage coin balance, active escrows, and transaction history
          </p>
        </div>
        <button
          type="button"
          onClick={() => exportTransactionsCSV(data.transactions)}
          className="bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 focus:ring-primary inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-colors focus:outline-none focus:ring-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          Export CSV
        </button>
      </div>

      {/* ─── 1. Wallet Summary ─── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-card text-card-foreground shadow-xs border">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs font-medium">Available Coins</p>
            <p className="text-primary mt-1 text-2xl font-extrabold">
              {data.availableCoins.toLocaleString()} 🪙
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card text-card-foreground shadow-xs border">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs font-medium">Escrow Coins</p>
            <p className="mt-1 text-2xl font-extrabold text-amber-500">
              {data.escrowCoins.toLocaleString()} 🪙
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card text-card-foreground shadow-xs border">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs font-medium">Lifetime Earned</p>
            <p className="mt-1 text-2xl font-extrabold text-emerald-500">
              {data.lifetimeEarned.toLocaleString()} 🪙
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card text-card-foreground shadow-xs border">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs font-medium">Lifetime Spent</p>
            <p className="text-foreground mt-1 text-2xl font-extrabold">
              {data.lifetimeSpent.toLocaleString()} 🪙
            </p>
          </CardContent>
        </Card>
        <Card className="bg-card text-card-foreground shadow-xs border">
          <CardContent className="p-4">
            <p className="text-muted-foreground text-xs font-medium">Pending Rewards</p>
            <p className="mt-1 text-2xl font-extrabold text-blue-500">
              {data.pendingRewards.toLocaleString()} 🪙
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ─── 4. Mission Payment Flow UI ─── */}
      <Card className="bg-card text-card-foreground shadow-xs border">
        <CardContent className="p-6">
          <h3 className="text-muted-foreground mb-4 text-sm font-semibold uppercase tracking-wider">
            Mission Payment Flow
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {PAYMENT_FLOW_STEPS.map((step) => {
              const isActive = step.step <= activeFlowStep;
              return (
                <div
                  key={step.step}
                  className={cn(
                    "flex flex-col items-center rounded-lg border p-3 text-center transition-all",
                    isActive
                      ? "bg-primary/5 border-primary/30 text-foreground"
                      : "bg-muted/20 border-border opacity-50",
                  )}
                >
                  <div
                    className={cn(
                      "mb-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {step.step}
                  </div>
                  <p className="text-xs font-bold leading-tight">{step.label}</p>
                  <p className="text-muted-foreground mt-0.5 text-[10px]">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ─── 3. Escrow Cards ─── */}
      <div className="flex flex-col gap-3">
        <h3 className="text-lg font-semibold">Active Escrows</h3>
        {data.escrows.length === 0 ? (
          <p className="text-muted-foreground text-xs">No active escrows.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.escrows.map((escrow) => (
              <Card key={escrow.id} className="bg-card text-card-foreground shadow-xs border">
                <CardContent className="flex h-full flex-col justify-between gap-3 p-4">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-foreground line-clamp-1 text-xs font-bold">
                        {escrow.missionTitle}
                      </h4>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] font-semibold uppercase",
                          escrow.status === "locked" &&
                            "border-amber-500/20 bg-amber-500/10 text-amber-500",
                          escrow.status === "releasing" &&
                            "border-blue-500/20 bg-blue-500/10 text-blue-500",
                          escrow.status === "released" &&
                            "border-emerald-500/20 bg-emerald-500/10 text-emerald-500",
                          escrow.status === "refunded" &&
                            "border-slate-500/20 bg-slate-500/10 text-slate-500",
                        )}
                      >
                        {escrow.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs">
                      Mission ID: {escrow.missionId}
                    </p>
                  </div>

                  <div className="space-y-1.5 border-t pt-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Locked Amount:</span>
                      <span className="font-bold text-amber-500">{escrow.lockedAmount} 🪙</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Unlock Condition:</span>
                      <span className="text-foreground max-w-[150px] truncate font-medium">
                        {escrow.unlockCondition}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Remaining Time:</span>
                      <span className="text-foreground font-medium">{escrow.remainingTime}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ─── 2. Transaction History & Filters ─── */}
      <Card className="bg-card text-card-foreground shadow-xs border">
        <CardContent className="p-6">
          <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <h3 className="text-lg font-semibold">Transaction History</h3>

            {/* 6. Filters */}
            <div className="bg-muted/40 flex flex-wrap items-center gap-1.5 rounded-lg border p-1">
              {(["All", "Rewards", "Escrow", "Refunds", "Purchases"] as FilterType[]).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={cn(
                    "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                    filter === f
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Transactions List */}
          {filteredTransactions.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center text-xs">
              No transactions match the selected filter.
            </p>
          ) : (
            <div className="divide-y overflow-hidden rounded-lg border">
              {filteredTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="hover:bg-muted/30 flex items-center justify-between p-3 text-xs transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                        tx.amount > 0
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-destructive/10 text-destructive",
                      )}
                    >
                      {tx.amount > 0 ? "+" : "-"}
                    </div>
                    <div>
                      <p className="text-foreground font-semibold">{tx.description}</p>
                      <p className="text-muted-foreground mt-0.5 text-[10px]">
                        {new Date(tx.timestamp).toLocaleString()} •{" "}
                        <span className="text-foreground font-medium">{tx.type}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={cn(
                        "text-sm font-bold",
                        tx.amount > 0 ? "text-emerald-500" : "text-foreground",
                      )}
                    >
                      {tx.amount > 0 ? `+${tx.amount}` : tx.amount} 🪙
                    </p>
                    <span className="text-muted-foreground text-[10px] font-semibold uppercase">
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
