"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

import { Button } from "@scoutx/ui";

/**
 * Client component that renders the correct header buttons based on
 * the current authentication session.
 *
 * - Unauthenticated: "Sign in" + "Launch mission" links
 * - Authenticated user: Dashboard link + "Sign out" button
 */
export function AuthHeaderActions() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-20 animate-pulse rounded-md bg-[var(--scoutx-border)]" />
        <div className="h-8 w-28 animate-pulse rounded-md bg-[var(--scoutx-border)]" />
      </div>
    );
  }

  if (session?.user) {
    const role = session.user.role;
    const dashboardHref = role === "SCOUT" ? "/scout/missions" : "/missions";

    return (
      <div className="flex items-center gap-2">
        <span className="hidden text-sm text-[var(--scoutx-muted-foreground)] md:inline">
          {session.user.email}
        </span>
        <Button variant="ghost" size="sm" asChild>
          <Link href={dashboardHref}>Dashboard</Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ redirect: true, callbackUrl: "/" })}
        >
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/missions/new">Launch mission</Link>
      </Button>
    </div>
  );
}
