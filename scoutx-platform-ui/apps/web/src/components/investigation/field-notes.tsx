"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, Badge, Button, Textarea, cn } from "@scoutx/ui";

/* ─── Types ─── */

export interface FieldNote {
  id: string;
  author: string;
  authorRole: "scout" | "requester" | "admin";
  content: string;
  tags?: string[];
  pinned: boolean;
  timestamp: string;
}

interface FieldNotesProps {
  notes: FieldNote[];
  /** Disable adding new notes (e.g. read-only view) */
  readOnly?: boolean;
  /** Callback when a new note is submitted */
  onAddNote?: (content: string) => void;
  className?: string;
}

const ROLE_BADGE_VARIANT = {
  scout: "default" as const,
  requester: "secondary" as const,
  admin: "warning" as const,
};

/* ─── Component ─── */

/**
 * FieldNotes displays a collection of investigation notes from scouts,
 * requesters, and admins. Supports pinning, tagging, and adding new notes.
 * Mobile: full width. Desktop: card layout.
 */
export function FieldNotes({ notes, readOnly = false, onAddNote, className }: FieldNotesProps) {
  const [newNote, setNewNote] = useState("");

  const sorted = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  const handleSubmit = () => {
    const trimmed = newNote.trim();
    if (!trimmed) return;
    onAddNote?.(trimmed);
    setNewNote("");
  };

  if (notes.length === 0 && readOnly) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
          <svg
            className="h-8 w-8 text-[var(--scoutx-muted-foreground)]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501A12.435 12.435 0 0012 21c2.107 0 4.106-.523 5.848-1.444.193-.29.513-.474.863-.5a31.448 31.448 0 003.424-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
            />
          </svg>
          <p className="text-sm font-medium text-[var(--scoutx-muted-foreground)]">
            No field notes yet
          </p>
          <p className="text-xs text-[var(--scoutx-muted-foreground)]">
            Notes from scouts and requesters appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold leading-tight tracking-tight text-[var(--scoutx-foreground)]">
          Field Notes
        </h3>
        <span className="text-xs tabular-nums text-[var(--scoutx-muted-foreground)]">
          {notes.length} note{notes.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* New note input */}
      {!readOnly && (
        <div className="flex flex-col gap-2">
          <Textarea
            placeholder="Add a field note…"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="min-h-[64px] resize-none text-sm"
            rows={2}
            aria-label="New field note"
          />
          <Button size="sm" onClick={handleSubmit} disabled={!newNote.trim()} className="self-end">
            Add Note
          </Button>
        </div>
      )}

      {/* Notes list */}
      <div className="space-y-2">
        {sorted.map((note, idx) => (
          <motion.div
            key={note.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.03 * idx, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "rounded-[var(--scoutx-radius-md)] border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-3",
              note.pinned && "border-[var(--scoutx-primary)]/30",
            )}
          >
            {/* Header */}
            <div className="mb-1.5 flex items-center gap-2">
              <Badge
                variant={ROLE_BADGE_VARIANT[note.authorRole]}
                className="text-[9px] uppercase tracking-wider"
              >
                {note.authorRole}
              </Badge>
              <span className="text-xs font-medium text-[var(--scoutx-foreground)]">
                {note.author}
              </span>
              {note.pinned && (
                <svg
                  className="h-3 w-3 text-[var(--scoutx-primary)]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path d="M5.5 3.5A1.5 1.5 0 017 2h6a1.5 1.5 0 011.5 1.5v1.429c0 .646-.147 1.283-.424 1.854l-.074.154a3.31 3.31 0 01-.993 1.31l-2.446 2.044a1 1 0 00-.363.78v2.592l-1.5 2.25V11.07a1 1 0 00-.363-.78L6.492 8.247a3.31 3.31 0 01-.993-1.31l-.074-.154A3.378 3.378 0 015 4.93V3.5z" />
                </svg>
              )}
            </div>

            {/* Content */}
            <p className="text-sm leading-relaxed text-[var(--scoutx-foreground)]">
              {note.content}
            </p>

            {/* Tags */}
            {note.tags && note.tags.length > 0 && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {note.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center rounded-full bg-[var(--scoutx-muted)] px-2 py-0.5 text-[9px] font-medium text-[var(--scoutx-muted-foreground)]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Timestamp */}
            <p className="mt-1 text-[10px] text-[var(--scoutx-muted-foreground)]">
              <time dateTime={note.timestamp}>{note.timestamp}</time>
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
