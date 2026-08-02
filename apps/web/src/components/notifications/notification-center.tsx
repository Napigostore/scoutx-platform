"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@scoutx/ui";
import { useRealtimeEvent } from "../../providers/realtime-event-provider";
import type { InvestigationRealtimeEvent } from "../../providers/realtime-types";

/* ─── Types ─── */

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: InvestigationRealtimeEvent["type"];
  investigationId?: string;
}

interface NotificationContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

const STORAGE_KEY = "scoutx_notifications_session_v1";

/* ─── Context ─── */

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within a NotificationProvider");
  }
  return ctx;
}

/* ─── Toast Interface ─── */

interface ToastItem extends NotificationItem {
  toastId: string;
}

/* ─── Provider Component ─── */

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      return saved ? (JSON.parse(saved) as NotificationItem[]) : [];
    } catch {
      return [];
    }
  });

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Persist to session storage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {
      // ignore storage errors
    }
  }, [notifications]);

  const addNotification = useCallback(
    (
      type: InvestigationRealtimeEvent["type"],
      title: string,
      message: string,
      investigationId?: string,
    ) => {
      const newItem: NotificationItem = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title,
        message,
        timestamp: new Date().toISOString(),
        read: false,
        type,
        investigationId,
      };

      setNotifications((prev) => [newItem, ...prev]);

      const toastId = `toast_${Date.now()}`;
      setToasts((prev) => [...prev, { ...newItem, toastId }]);

      // Auto dismiss toast after 4s
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
      }, 4000);
    },
    [],
  );

  // Subscribe to Realtime Events
  useRealtimeEvent("*", (event) => {
    switch (event.type) {
      case "evidence.created":
        addNotification(
          event.type,
          "New Evidence Uploaded",
          event.item.caption || "New evidence item has been added to the case.",
          event.investigationId,
        );
        break;
      case "evidence.updated":
        addNotification(
          event.type,
          "Evidence Updated",
          `Status changed for evidence in investigation ${event.investigationId}`,
          event.investigationId,
        );
        break;
      case "timeline.created":
        addNotification(
          event.type,
          "Timeline Update",
          event.event.summary || "New timeline entry posted.",
          event.investigationId,
        );
        break;
      case "trust.updated":
        addNotification(
          event.type,
          "Trust Score Updated",
          `Trust score updated to ${event.trustScore}%`,
          event.investigationId,
        );
        break;
      case "coin.updated":
        addNotification(
          event.type,
          "Bounty Updated",
          `Bounty updated to ${event.currentBounty ?? event.amount ?? 0} coins`,
          event.investigationId,
        );
        break;
      case "mission.updated":
        addNotification(
          event.type,
          "Mission Updated",
          `Mission info modified in investigation ${event.investigationId}`,
          event.investigationId,
        );
        break;
    }
  });

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const contextValue = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clearNotifications,
    }),
    [notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications],
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {/* ─── Toast Notifications Container ─── */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-full max-w-sm flex-col gap-2 px-4"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.toastId}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-card text-card-foreground dark:border-border pointer-events-auto flex w-full items-start gap-3 rounded-lg border p-4 shadow-lg"
            >
              <div className="bg-primary/10 text-primary mt-0.5 rounded-full p-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
              </div>
              <div className="flex-1 text-xs">
                <p className="text-foreground font-semibold">{toast.title}</p>
                <p className="text-muted-foreground mt-0.5">{toast.message}</p>
              </div>
              <button
                type="button"
                onClick={() => setToasts((prev) => prev.filter((t) => t.toastId !== toast.toastId))}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Dismiss toast"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

/* ─── Notification Bell Component ─── */

interface NotificationBellProps {
  className?: string;
}

export function NotificationBell({ className }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount } = useNotifications();

  return (
    <div className={cn("relative inline-block", className)}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="text-muted-foreground hover:bg-accent hover:text-accent-foreground focus:ring-primary relative rounded-full p-2 transition-colors focus:outline-none focus:ring-2"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={isOpen}
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="bg-destructive text-destructive-foreground absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && <NotificationDropdown onClose={() => setIsOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

/* ─── Notification Dropdown Component ─── */

interface NotificationDropdownProps {
  onClose: () => void;
}

export function NotificationDropdown({ onClose }: NotificationDropdownProps) {
  const { notifications, markAsRead, markAllAsRead, clearNotifications } = useNotifications();

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="bg-background/50 fixed inset-0 z-40 backdrop-blur-sm sm:hidden"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        className="bg-popover text-popover-foreground fixed inset-x-4 top-16 z-50 flex max-h-[80vh] flex-col rounded-xl border shadow-2xl sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-2 sm:max-h-[480px] sm:w-80"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold">Notifications</h4>
            {notifications.filter((n) => !n.read).length > 0 && (
              <span className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-[11px] font-medium">
                {notifications.filter((n) => !n.read).length} new
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-muted-foreground hover:text-foreground font-medium transition-colors"
            >
              Mark all read
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground sm:hidden"
              aria-label="Close notifications"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 divide-y overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-muted-foreground p-8 text-center text-xs">
              No notifications yet
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                onClick={() => markAsRead(item.id)}
                className={cn(
                  "hover:bg-muted/50 group relative flex cursor-pointer items-start gap-3 p-3 transition-colors",
                  !item.read && "bg-muted/20 font-medium",
                )}
              >
                <div
                  className={cn(
                    "mt-1 h-2 w-2 shrink-0 rounded-full",
                    item.read ? "bg-transparent" : "bg-primary",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-foreground truncate text-xs font-semibold">{item.title}</p>
                    <time className="text-muted-foreground whitespace-nowrap text-[10px]">
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                  <p className="text-muted-foreground mt-0.5 line-clamp-2 text-xs">
                    {item.message}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t p-2 text-center">
            <button
              type="button"
              onClick={clearNotifications}
              className="text-muted-foreground hover:text-destructive text-[11px] transition-colors"
            >
              Clear all notifications
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}
