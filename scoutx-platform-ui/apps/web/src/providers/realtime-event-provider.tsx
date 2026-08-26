"use client";

import {
  createContext,
  useContext,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  InvestigationRealtimeEvent,
  ConnectionStatus,
  RealtimeEventHandler,
  RealtimeEventProviderState,
} from "./realtime-types";

/* --- Context --- */

const RealtimeContext = createContext<RealtimeEventProviderState | null>(null);

/* --- Provider --- */

interface RealtimeEventProviderProps {
  investigationId: string;
  wsUrl: string;
  children: ReactNode;
}

const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 30_000;
const BACKOFF_MULTIPLIER = 2;

export function RealtimeEventProvider({
  investigationId,
  wsUrl,
  children,
}: RealtimeEventProviderProps) {
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, Set<RealtimeEventHandler>>>(new Map());
  const backoffRef = useRef(INITIAL_BACKOFF_MS);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const subscribedEventsRef = useRef<Set<string>>(new Set());

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    const url = new URL(wsUrl);
    url.searchParams.set("investigationId", investigationId);
    const ws = new WebSocket(url.toString());
    wsRef.current = ws;

    ws.onopen = () => {
      if (!mountedRef.current) {
        ws.close();
        return;
      }
      setStatus("live");
      backoffRef.current = INITIAL_BACKOFF_MS;
      subscribedEventsRef.current.clear();
    };

    ws.onmessage = (msg: MessageEvent) => {
      if (!mountedRef.current) return;
      try {
        const event: InvestigationRealtimeEvent = JSON.parse(msg.data);
        const allHandlers = handlersRef.current.get("*") ?? new Set();
        const typeHandlers = handlersRef.current.get(event.type) ?? new Set();
        const combined = new Set([...allHandlers, ...typeHandlers]);
        for (const handler of combined) {
          handler(event);
        }
      } catch {
        // ignore malformed messages
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
      if (!mountedRef.current) return;
      setStatus("reconnecting");
      const delay = backoffRef.current;
      backoffRef.current = Math.min(backoffRef.current * BACKOFF_MULTIPLIER, MAX_BACKOFF_MS);
      reconnectTimerRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => {
      ws.close();
    };
  }, [wsUrl, investigationId]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);

  const subscribe = useCallback((handler: RealtimeEventHandler): (() => void) => {
    const handlers = handlersRef.current.get("*") ?? new Set();
    handlers.add(handler);
    handlersRef.current.set("*", handlers);
    return () => {
      handlers.delete(handler);
    };
  }, []);

  const subscribeType = useCallback(
    (type: InvestigationRealtimeEvent["type"], handler: RealtimeEventHandler): (() => void) => {
      const handlers = handlersRef.current.get(type) ?? new Set();
      handlers.add(handler);
      handlersRef.current.set(type, handlers);
      return () => {
        handlers.delete(handler);
      };
    },
    [],
  );

  const value = useMemo<RealtimeEventProviderState>(
    () => ({ status, subscribe, subscribeType }),
    [status, subscribe, subscribeType],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

/* --- Hooks --- */

export function useRealtime(): RealtimeEventProviderState | null {
  return useContext(RealtimeContext);
}

export function useRealtimeEvent(
  type: InvestigationRealtimeEvent["type"] | "*",
  handler: RealtimeEventHandler,
): void {
  const ctx = useContext(RealtimeContext);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!ctx) return;
    const wrapped: RealtimeEventHandler = (event) => {
      handlerRef.current(event);
    };
    const unsub = type === "*" ? ctx.subscribe(wrapped) : ctx.subscribeType(type, wrapped);
    return unsub;
  }, [type, ctx]);
}

export function useConnectionStatus(): ConnectionStatus {
  const ctx = useRealtime();
  return ctx?.status ?? "offline";
}
