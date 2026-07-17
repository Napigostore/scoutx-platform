"use client";

import { useState } from "react";
import type { FormEvent } from "react";

import { Button, Textarea } from "@scoutx/ui";

export function ChatGPTAssistant() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setReply("");

    if (!prompt.trim()) {
      setError("Please enter a question or mission prompt.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error ?? "Something went wrong.");
      } else {
        setReply(data.message);
      }
    } catch {
      setError("Unable to connect to the assistant. Try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="section-shell scroll-mt-24 py-20" aria-label="ChatGPT assistant">
      <div className="mx-auto max-w-4xl space-y-6 rounded-3xl border border-[var(--scoutx-border)] bg-white/90 p-6 shadow-[0_24px_80px_rgba(18,32,26,0.08)] backdrop-blur-sm sm:p-8">
        <div className="space-y-3 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--scoutx-primary)]">
            AI assistant
          </p>
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
            Ask ChatGPT for mission-writing and local scouting guidance
          </h2>
          <p className="mx-auto max-w-2xl text-[var(--scoutx-muted-foreground)]">
            Use AI to refine your mission request, describe what you need from a scout, or get ideas for the best questions to ask.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="chatPrompt" className="mb-2 block text-sm font-medium text-[var(--scoutx-foreground)]">
              Your question for ScoutX Assistant
            </label>
            <Textarea
              id="chatPrompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="E.g. How do I ask a scout to verify the south gate at night?"
              className="min-h-[140px]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? "Thinking..." : "Ask assistant"}
            </Button>
            <p className="text-sm text-[var(--scoutx-muted-foreground)]">
              Powered by OpenAI. Requires an `OPENAI_API_KEY` on the server.
            </p>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {reply ? (
            <div className="rounded-3xl border border-[var(--scoutx-border)] bg-[var(--scoutx-background)] p-5 text-sm leading-7 text-[var(--scoutx-foreground)] shadow-sm">
              <p className="font-semibold text-[var(--scoutx-foreground)]">Assistant response</p>
              <p className="mt-3 whitespace-pre-line">{reply}</p>
            </div>
          ) : null}
        </form>
      </div>
    </section>
  );
}
