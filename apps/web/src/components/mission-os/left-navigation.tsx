"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { cn, Badge } from "@scoutx/ui";

/* ─── Types ─── */

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  /** Icon name for the nav item */
  icon:
    | "compass"
    | "radar"
    | "map"
    | "shield"
    | "wallet"
    | "users"
    | "settings"
    | "activity"
    | "message"
    | "bot";
  /** Active mission indicator */
  isActive?: boolean;
  /** Notification / count badge */
  count?: number;
}

interface LeftNavigationProps {
  /** Navigation sections */
  sections: NavSection[];
  /** Active item ID */
  activeItemId?: string;
  /** Callback when an item is clicked */
  onItemClick?: (item: NavItem) => void;
  className?: string;
}

/* ─── Icon component ─── */

function NavIcon({ icon, className }: { icon: NavItem["icon"]; className?: string }) {
  const cls = cn("h-4 w-4", className);
  switch (icon) {
    case "compass":
      return (
        <svg
          className={cls}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.712 4.33a9.027 9.027 0 011.652 1.306c.51.51.944 1.064 1.306 1.652M16.712 4.33l-3.448 4.138m3.448-4.138a9.014 9.014 0 00-9.424 0M19.67 7.288l-4.138 3.448m4.138-3.448a9.014 9.014 0 010 9.424m-4.138-5.976a3.736 3.736 0 00-.88-1.388 3.737 3.737 0 00-1.388-.88m2.268 2.268a3.765 3.765 0 010 2.528m-2.268-4.796l-3.448 4.138m0 0a3.736 3.736 0 00-.88 1.388 3.765 3.765 0 000 2.528m.88-3.916l-4.138 3.448m0 0a9.027 9.027 0 01-1.306 1.652 9.027 9.027 0 01-1.652 1.306m2.958-2.958l-3.448 4.138m3.448-4.138a9.014 9.014 0 010 9.424m-3.448-5.286a3.736 3.736 0 001.388.88 3.765 3.765 0 002.528 0m-3.916-.88l3.448 4.138m0 0a9.027 9.027 0 001.652 1.306 9.027 9.027 0 001.652 1.306"
          />
        </svg>
      );
    case "radar":
      return (
        <svg
          className={cls}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.348 14.651a3.75 3.75 0 010-5.303m0 5.303a3.75 3.75 0 005.303 0m-5.303 0a3.75 3.75 0 005.303 0m0-5.303a3.75 3.75 0 010 5.303M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    case "map":
      return (
        <svg
          className={cls}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
          />
        </svg>
      );
    case "shield":
      return (
        <svg
          className={cls}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
          />
        </svg>
      );
    case "wallet":
      return (
        <svg
          className={cls}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
          />
        </svg>
      );
    case "users":
      return (
        <svg
          className={cls}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
          />
        </svg>
      );
    case "settings":
      return (
        <svg
          className={cls}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case "activity":
      return (
        <svg
          className={cls}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6h16.5M3.75 12h16.5m-16.5 6h16.5"
          />
        </svg>
      );
    case "message":
      return (
        <svg
          className={cls}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
          />
        </svg>
      );
    case "bot":
      return (
        <svg
          className={cls}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
          />
        </svg>
      );
    default:
      return null;
  }
}

/* ─── Component ─── */

/**
 * LeftNavigation provides the primary navigation for Mission OS.
 * Vertical layout with grouped sections: Intelligence, Operations, Analytics, Settings.
 * Active items glow with the primary color. Count badges indicate pending items.
 */
export function LeftNavigation({
  sections,
  activeItemId,
  onItemClick,
  className,
}: LeftNavigationProps) {
  return (
    <nav
      className={cn(
        "flex h-full flex-col gap-6 overflow-y-auto border-r border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-3",
        className,
      )}
      aria-label="Mission OS Navigation"
    >
      {/* Brand */}
      <Link
        href="/"
        className="flex items-center gap-2.5 px-2 py-1 transition-opacity hover:opacity-90"
      >
        <Image
          src="/logo-icon.png"
          alt="Fiwokan"
          width={28}
          height={28}
          className="h-7 w-7 shrink-0 object-contain"
        />
        <div className="flex flex-col">
          <span className="font-display text-sm font-bold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
            Fiwokan
          </span>
          <span className="text-[10px] font-medium leading-none text-[var(--scoutx-muted-foreground)]">
            Mission OS
          </span>
        </div>
      </Link>

      {/* Sections */}
      {sections.map((section) => (
        <div key={section.id} className="space-y-1">
          <p className="px-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--scoutx-muted-foreground)]">
            {section.label}
          </p>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const isActive = item.id === activeItemId;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={(e) => {
                    if (onItemClick) {
                      e.preventDefault();
                      onItemClick(item);
                    }
                  }}
                  className={cn(
                    "group relative flex items-center gap-2.5 rounded-[var(--scoutx-radius-md)] px-2.5 py-1.5 text-xs font-medium transition-all duration-150",
                    isActive
                      ? "bg-[var(--scoutx-primary)]/10 text-[var(--scoutx-primary)]"
                      : "hover:bg-[var(--scoutx-muted)]/30 text-[var(--scoutx-muted-foreground)] hover:text-[var(--scoutx-foreground)]",
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {/* Active indicator bar */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-[var(--scoutx-primary)]"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}

                  <NavIcon icon={item.icon} />
                  <span className="truncate">{item.label}</span>

                  {/* Count badge */}
                  {item.count != null && item.count > 0 && (
                    <Badge
                      variant={isActive ? "default" : "outline"}
                      className="ml-auto shrink-0 text-[8px] leading-none"
                    >
                      {item.count > 99 ? "99+" : item.count}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}
