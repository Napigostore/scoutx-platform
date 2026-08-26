"use client";

import { useQuery } from "@tanstack/react-query";

import type { MatchResult } from "@scoutx/types";

interface MatchesResponse {
  missionId: string;
  matches: MatchResult[];
}

async function fetchMatches(): Promise<MatchesResponse> {
  const response = await fetch("/api/matches");
  if (!response.ok) {
    throw new Error("Failed to load matches");
  }
  return (await response.json()) as MatchesResponse;
}

export function MatchPreview() {
  const query = useQuery({
    queryKey: ["landing-matches"],
    queryFn: fetchMatches,
  });

  if (query.isPending) {
    return (
      <p className="text-sm text-[var(--scoutx-muted-foreground)]">Loading scout matches…</p>
    );
  }

  if (query.isError) {
    return (
      <p className="text-sm text-red-600">
        {query.error instanceof Error ? query.error.message : "Unable to load matches"}
      </p>
    );
  }

  const top = query.data.matches[0];
  if (!top) {
    return (
      <p className="text-sm text-[var(--scoutx-muted-foreground)]">
        No eligible scouts for the sample mission.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--scoutx-border)] bg-white/70 p-4 text-sm">
      <p className="font-medium text-[var(--scoutx-foreground)]">
        Top match score {(top.score * 100).toFixed(0)}% · {top.distanceMeters}m away
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-[var(--scoutx-muted-foreground)]">
        {top.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </div>
  );
}
