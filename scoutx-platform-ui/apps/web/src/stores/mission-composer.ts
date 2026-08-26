"use client";

import { create } from "zustand";

import type { MissionCategory } from "@scoutx/types";

export interface MissionComposerDraft {
  title: string;
  description: string;
  category: MissionCategory;
  cityQuery: string;
}

interface MissionComposerState {
  draft: MissionComposerDraft;
  isComposerFocused: boolean;
  setDraft: (partial: Partial<MissionComposerDraft>) => void;
  setComposerFocused: (focused: boolean) => void;
  resetDraft: () => void;
}

const initialDraft: MissionComposerDraft = {
  title: "",
  description: "",
  category: "GENERAL_OBSERVATION",
  cityQuery: "",
};

export const useMissionComposerStore = create<MissionComposerState>((set) => ({
  draft: initialDraft,
  isComposerFocused: false,
  setDraft: (partial) =>
    set((state) => ({
      draft: {
        ...state.draft,
        ...partial,
      },
    })),
  setComposerFocused: (focused) => set({ isComposerFocused: focused }),
  resetDraft: () => set({ draft: initialDraft, isComposerFocused: false }),
}));
