"use client";

import { useState } from "react";

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [feedback, setFeedback] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setOpen(false);
      setFeedback("");
    }, 1500);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open ? (
        <div className="bg-card w-80 space-y-3 rounded-2xl border p-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold">Share Beta Feedback</h4>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground text-xs"
            >
              ✕
            </button>
          </div>

          {submitted ? (
            <p className="py-4 text-center text-xs font-semibold text-emerald-500">
              ✓ Thank you for your feedback!
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-2">
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us what you like or report a bug..."
                rows={3}
                required
                className="bg-background focus:outline-hidden focus:ring-primary w-full rounded-lg border p-2 text-xs focus:ring-1"
              />
              <button
                type="submit"
                className="bg-primary text-primary-foreground hover:bg-primary/90 w-full rounded-lg py-1.5 text-xs font-semibold"
              >
                Send Feedback
              </button>
            </form>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-4 py-2 text-xs font-bold shadow-lg transition-all hover:scale-105"
        >
          💬 Feedback
        </button>
      )}
    </div>
  );
}
