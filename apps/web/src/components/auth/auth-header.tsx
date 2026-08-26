"use client";

import { useState, useEffect } from "react";
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
  const [dashboardHref, setDashboardHref] = useState<string>("");

  useEffect(() => {
    if (session?.user) {
      setDashboardHref("/my-missions");
    }
  }, [session]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-20 animate-pulse rounded-md bg-[var(--scoutx-border)]" />
        <div className="h-8 w-28 animate-pulse rounded-md bg-[var(--scoutx-border)]" />
      </div>
    );
  }

  if (session?.user) {
    const targetHref = dashboardHref || "/my-missions";

    const avatarUrl = session.user.image || null;
    const userInitials = (session.user.name || session.user.email || "U")
      .substring(0, 2)
      .toUpperCase();

    return (
      <div className="flex items-center gap-2">
        <Link
          href="/profile"
          className="flex items-center gap-2 rounded-full border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] px-2.5 py-1 text-xs font-semibold text-[var(--scoutx-foreground)] transition-colors hover:bg-[var(--scoutx-muted)]"
          title="View Your Profile"
        >
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="Avatar" className="h-5 w-5 rounded-full object-cover" />
          ) : (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--scoutx-primary)] text-[10px] font-extrabold text-white">
              {userInitials}
            </span>
          )}
          <span className="hidden font-bold sm:inline">Profile</span>
        </Link>

        <Button variant="ghost" size="sm" asChild>
          <Link href={targetHref} prefetch={false}>
            Dashboard
          </Link>
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
        <Link href="/profile">👤 Profile</Link>
      </Button>
      <Button variant="ghost" size="sm" asChild>
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/missions/new">Launch mission</Link>
      </Button>
    </div>
  );
}
