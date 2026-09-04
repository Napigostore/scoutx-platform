"use client";

import { useState, useEffect } from "react";
import { Button } from "@scoutx/ui";

interface ApiKeyItem {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  lastUsedAt: string | null;
  createdAt: string;
}

interface WebhookItem {
  id: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
  createdAt: string;
}

export function DeveloperSettings() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [keyName, setKeyName] = useState("");
  const [newRawKey, setNewRawKey] = useState<string | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("");

  useEffect(() => {
    fetchDeveloperData();
  }, []);

  async function fetchDeveloperData() {
    try {
      const [resKeys, resWh] = await Promise.all([
        fetch("/api/v1/api-keys"),
        fetch("/api/v1/webhooks"),
      ]);
      if (resKeys.ok) {
        const data = await resKeys.json();
        setKeys(data.keys || []);
      }
      if (resWh.ok) {
        const data = await resWh.json();
        setWebhooks(data.webhooks || []);
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateKey(e: React.FormEvent) {
    e.preventDefault();
    if (!keyName.trim()) return;

    try {
      const res = await fetch("/api/v1/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: keyName }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewRawKey(data.key.rawKey);
        setKeyName("");
        fetchDeveloperData();
      }
    } catch {
      // Ignore
    }
  }

  async function handleRevokeKey(id: string) {
    try {
      await fetch(`/api/v1/api-keys/${id}`, { method: "DELETE" });
      fetchDeveloperData();
    } catch {
      // Ignore
    }
  }

  async function handleCreateWebhook(e: React.FormEvent) {
    e.preventDefault();
    if (!webhookUrl.trim()) return;

    try {
      const res = await fetch("/api/v1/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: webhookUrl }),
      });
      if (res.ok) {
        setWebhookUrl("");
        fetchDeveloperData();
      }
    } catch {
      // Ignore
    }
  }

  async function handleDeleteWebhook(id: string) {
    try {
      await fetch(`/api/v1/webhooks/${id}`, { method: "DELETE" });
      fetchDeveloperData();
    } catch {
      // Ignore
    }
  }

  if (loading) {
    return (
      <div className="p-4 text-sm text-[var(--scoutx-muted-foreground)]">
        Loading Developer Settings...
      </div>
    );
  }

  return (
    <div className="space-y-8 rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-6 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-[var(--scoutx-foreground)]">
          Developer & Enterprise API Keys
        </h3>
        <p className="mt-1 text-xs text-[var(--scoutx-muted-foreground)]">
          Generate API keys to interact with the Fiwokan REST API v1 programmatically.
        </p>

        {newRawKey && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            <p className="text-xs font-semibold uppercase tracking-wider">Save your API Key now</p>
            <p className="mt-1 text-xs">It will not be displayed again!</p>
            <code className="mt-2 block rounded bg-amber-100 p-2 font-mono text-sm dark:bg-amber-900/50">
              {newRawKey}
            </code>
            <Button className="mt-3 text-xs" variant="outline" onClick={() => setNewRawKey(null)}>
              I have saved it
            </Button>
          </div>
        )}

        <form onSubmit={handleCreateKey} className="mt-4 flex gap-2">
          <input
            type="text"
            placeholder="Key Name (e.g. Production Backend)"
            className="flex-1 rounded-xl border border-[var(--scoutx-border)] bg-[var(--scoutx-background)] px-3 py-2 text-sm"
            value={keyName}
            onChange={(e) => setKeyName(e.target.value)}
          />
          <Button type="submit">Create Key</Button>
        </form>

        <div className="mt-4 space-y-2">
          {keys.length === 0 ? (
            <p className="text-xs italic text-[var(--scoutx-muted-foreground)]">
              No API keys created yet.
            </p>
          ) : (
            keys.map((k) => (
              <div
                key={k.id}
                className="flex items-center justify-between rounded-xl border border-[var(--scoutx-border)] p-3 text-sm"
              >
                <div>
                  <div className="font-semibold text-[var(--scoutx-foreground)]">{k.name}</div>
                  <div className="font-mono text-xs text-[var(--scoutx-muted-foreground)]">
                    {k.keyPrefix}... • Scopes: {k.scopes.join(", ")}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  className="text-xs text-red-600 hover:bg-red-50"
                  onClick={() => handleRevokeKey(k.id)}
                >
                  Revoke
                </Button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="border-t border-[var(--scoutx-border)] pt-6">
        <h3 className="text-lg font-semibold text-[var(--scoutx-foreground)]">
          Webhook Subscriptions
        </h3>
        <p className="mt-1 text-xs text-[var(--scoutx-muted-foreground)]">
          Receive real-time HTTP callbacks when events occur in your research missions.
        </p>

        <form onSubmit={handleCreateWebhook} className="mt-4 flex gap-2">
          <input
            type="url"
            placeholder="Webhook Target URL (https://your-domain.com/webhook)"
            className="flex-1 rounded-xl border border-[var(--scoutx-border)] bg-[var(--scoutx-background)] px-3 py-2 text-sm"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
          />
          <Button type="submit">Add Webhook</Button>
        </form>

        <div className="mt-4 space-y-2">
          {webhooks.length === 0 ? (
            <p className="text-xs italic text-[var(--scoutx-muted-foreground)]">
              No webhooks configured.
            </p>
          ) : (
            webhooks.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between rounded-xl border border-[var(--scoutx-border)] p-3 text-sm"
              >
                <div>
                  <div className="font-mono font-medium text-[var(--scoutx-foreground)]">
                    {w.url}
                  </div>
                  <div className="text-xs text-[var(--scoutx-muted-foreground)]">
                    Secret: <code className="font-mono">{w.secret}</code>
                  </div>
                </div>
                <Button
                  variant="secondary"
                  className="text-xs text-red-600 hover:bg-red-50"
                  onClick={() => handleDeleteWebhook(w.id)}
                >
                  Delete
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
