import React from "react";

export type MissionStatusType =
  | "OPEN"
  | "MATCHED"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "VERIFIED"
  | "COMPLETED"
  | "REJECTED"
  | "CANCELLED"
  | string;

interface MissionStatusBadgeProps {
  status: MissionStatusType;
  className?: string;
}

export function MissionStatusBadge({ status, className = "" }: MissionStatusBadgeProps) {
  const getStatusConfig = (st: string) => {
    switch (st.toUpperCase()) {
      case "OPEN":
        return {
          label: "Open",
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
          dot: "bg-emerald-500",
        };
      case "MATCHED":
        return {
          label: "Matched",
          bg: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
          dot: "bg-blue-500",
        };
      case "IN_PROGRESS":
        return {
          label: "In Progress",
          bg: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-800",
          dot: "bg-indigo-500",
        };
      case "SUBMITTED":
        return {
          label: "Submitted",
          bg: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800",
          dot: "bg-amber-500",
        };
      case "VERIFIED":
        return {
          label: "Verified",
          bg: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800",
          dot: "bg-teal-500",
        };
      case "COMPLETED":
        return {
          label: "Completed",
          bg: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/60 dark:text-green-300 dark:border-green-800",
          dot: "bg-green-500",
        };
      case "REJECTED":
        return {
          label: "Rejected",
          bg: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/60 dark:text-red-300 dark:border-red-800",
          dot: "bg-red-500",
        };
      case "CANCELLED":
        return {
          label: "Cancelled",
          bg: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
          dot: "bg-slate-400",
        };
      default:
        return {
          label: st,
          bg: "bg-gray-50 text-gray-700 border-gray-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
          dot: "bg-slate-400",
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.bg} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
