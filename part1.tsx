"use client";

import { useState, useRef, useCallback, useMemo, useEffect, type DragEvent, type ChangeEvent, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, cn } from "@scoutx/ui";

export interface EvidenceItem {
  readonly id: string;
  readonly photoUrl: string;
  readonly caption: string;
  readonly capturedAt: string;
  readonly capturedBy: string;
  readonly verified: boolean;
  readonly mimeType?: string;
  readonly fileSize?: number;
}

interface UploadFile {
  readonly id: string;
  readonly file: File;
  readonly preview: string;
  readonly progress: number;
  readonly status: "pending" | "uploading" | "done" | "error";
  readonly error?: string;
}

interface EvidenceGalleryProps {
  readonly items: EvidenceItem[];
  readonly missionId?: string;
  readonly className?: string;
  readonly onItemsChange?: (items: EvidenceItem[]) => void;
}
