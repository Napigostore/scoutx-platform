"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Label } from "@scoutx/ui";

import { useMissionComposerStore } from "@/stores/mission-composer";

interface AttachmentItem {
  token?: string;
  storageKey: string;
  url: string;
  fileName: string;
  mimeType: string;
}

export default function NewMissionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("STREET_CONDITIONS");
  const [urgency, setUrgency] = useState("NORMAL");
  const [budgetAmount, setBudgetAmount] = useState("100000");
  const locationId = "00000000-0000-0000-0000-000000000001";
  const [latitude, setLatitude] = useState("35.658034");
  const [longitude, setLongitude] = useState("139.701636");
  const [radiusMeters, setRadiusMeters] = useState("1500");
  const [requiredTags, setRequiredTags] = useState("tokyo, shibuya");
  const [expiresAt, setExpiresAt] = useState("");

  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 1. Check for pending draft in localStorage (e.g. preserved after 401 re-authentication)
    if (typeof window !== "undefined") {
      const pendingDraft = localStorage.getItem("fiwokan_pending_mission_draft");
      if (pendingDraft) {
        try {
          const parsed = JSON.parse(pendingDraft);
          if (parsed.title) setTitle(parsed.title);
          if (parsed.description) setDescription(parsed.description);
          if (parsed.category) setCategory(parsed.category);
          if (parsed.urgency) setUrgency(parsed.urgency);
          if (parsed.budget?.amountCents) setBudgetAmount(String(parsed.budget.amountCents));
          if (parsed.coordinates?.latitude) setLatitude(String(parsed.coordinates.latitude));
          if (parsed.coordinates?.longitude) setLongitude(String(parsed.coordinates.longitude));
          if (parsed.radiusMeters) setRadiusMeters(String(parsed.radiusMeters));
          if (parsed.requiredTags?.length) setRequiredTags(parsed.requiredTags.join(", "));
          if (parsed.attachments) setAttachments(parsed.attachments);
          if (parsed.expiresAt) {
            try {
              setExpiresAt(new Date(parsed.expiresAt).toISOString().substring(0, 16));
            } catch {
              // ignore date parse error
            }
          }
        } catch {
          // ignore JSON parse error
        }
      } else {
        // 2. Pre-fill from composer store draft if present
        const draft = useMissionComposerStore.getState().draft;
        if (draft.title) setTitle(draft.title);
        if (draft.description) setDescription(draft.description);
        if (draft.category) setCategory(draft.category);
      }
    }

    // Set default expiresAt to 7 days from now if empty
    setExpiresAt((prev) => {
      if (prev) return prev;
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 7);
      return defaultDate.toISOString().substring(0, 16);
    });
  }, []);

  const handleAttachmentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError("");

    const token = localStorage.getItem("accessToken");
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;

        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/evidence/upload/reference", {
          method: "POST",
          headers,
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || `Failed to upload ${file.name}`);
        }

        setAttachments((prev) => [
          ...prev,
          {
            token: data.token,
            storageKey: data.storageKey,
            url: data.url,
            fileName: data.fileName,
            mimeType: data.mimeType,
          },
        ]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeAttachment = async (index: number) => {
    const target = attachments[index];
    if (target?.token) {
      const authToken = localStorage.getItem("accessToken");
      const headers: Record<string, string> = {};
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      fetch(`/api/evidence/upload/reference?token=${encodeURIComponent(target.token)}`, {
        method: "DELETE",
        headers,
      }).catch(() => null);
    }

    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const amountCents = Math.round(parseFloat(budgetAmount));
    if (isNaN(amountCents) || amountCents <= 0) {
      setError("Budget must be a positive number");
      setIsLoading(false);
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      setError("Latitude and Longitude must be valid numbers");
      setIsLoading(false);
      return;
    }

    const radius = parseInt(radiusMeters);
    if (isNaN(radius) || radius <= 0) {
      setError("Radius must be a positive integer");
      setIsLoading(false);
      return;
    }

    const tags = requiredTags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const payload = {
      title,
      description,
      category,
      urgency,
      budget: {
        amountCents,
        currency: "VND",
      },
      locationId,
      coordinates: {
        latitude: lat,
        longitude: lng,
      },
      radiusMeters: radius,
      requiredTags: tags,
      expiresAt: new Date(expiresAt).toISOString(),
      attachments,
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const token = localStorage.getItem("accessToken");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const res = await fetch("/api/missions", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const contentType = res.headers.get("content-type") ?? "";
      let data: { error?: string; id?: string } | null = null;
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        if (res.status === 401) {
          if (typeof window !== "undefined") {
            localStorage.setItem("fiwokan_pending_mission_draft", JSON.stringify(payload));
          }
          router.push("/sign-in?callbackUrl=/missions/new");
          return;
        }
        throw new Error(
          `Save Draft API returned non-JSON response (${res.status}): ${text.slice(0, 200)}`,
        );
      }

      if (!res.ok) {
        if (res.status === 401) {
          if (typeof window !== "undefined") {
            localStorage.setItem("fiwokan_pending_mission_draft", JSON.stringify(payload));
          }
          router.push("/sign-in?callbackUrl=/missions/new");
          return;
        }
        throw new Error(data?.error || "Failed to create mission");
      }

      // Success: draft persisted! Remove pending draft from localStorage
      if (typeof window !== "undefined") {
        localStorage.removeItem("fiwokan_pending_mission_draft");
      }
      useMissionComposerStore.getState().resetDraft();
      router.push("/missions");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-b border-[var(--scoutx-border)] pb-6">
        <h1 className="font-display text-3xl font-bold text-[var(--scoutx-foreground)]">
          Create New Mission
        </h1>
        <p className="mt-2 text-sm text-[var(--scoutx-muted-foreground)]">
          Launch a new real-world discovery request for local scouts
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Mission Title</Label>
            <Input
              id="title"
              required
              placeholder="e.g., Verify crowd density at Shibuya Crossing"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              required
              rows={4}
              className="flex w-full rounded-md border border-[var(--scoutx-border)] bg-white px-3 py-2 text-sm placeholder-[var(--scoutx-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--scoutx-primary)] disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Provide detailed instructions for the scout..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {/* Reference Media Attachments Section */}
          <div className="space-y-3 rounded-2xl border border-[var(--scoutx-border)] bg-gray-50/50 p-5">
            <div>
              <Label className="text-base font-semibold text-[var(--scoutx-foreground)]">
                Reference photos or videos
              </Label>
              <p className="mt-1 text-xs text-[var(--scoutx-muted-foreground)]">
                Upload photos or videos that help Scouts understand exactly what you need.
              </p>
            </div>

            {attachments.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-3">
                {attachments.map((att, idx) => {
                  const isVideo =
                    att.mimeType?.startsWith("video/") || att.fileName.match(/\.(mp4|webm|mov)$/i);

                  return (
                    <div
                      key={att.storageKey || idx}
                      className="group relative overflow-hidden rounded-xl border border-[var(--scoutx-border)] bg-white p-2 shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="absolute right-2 top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-red-600 text-xs font-bold text-white shadow-md hover:bg-red-700"
                        title="Remove attachment"
                      >
                        ✕
                      </button>

                      {isVideo ? (
                        <video src={att.url} className="h-28 w-full rounded-lg object-cover" />
                      ) : (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          src={att.url}
                          alt={att.fileName}
                          className="h-28 w-full rounded-lg object-cover"
                        />
                      )}

                      <p className="mt-2 truncate text-center text-[11px] font-medium text-gray-700">
                        {att.fileName}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleAttachmentUpload}
              className="hidden"
            />

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoading || isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? "Uploading reference file..." : "📷 Add reference photo or video"}
            </Button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                className="flex h-10 w-full rounded-md border border-[var(--scoutx-border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--scoutx-primary)]"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isLoading}
              >
                <option value="STREET_CONDITIONS">Street Conditions</option>
                <option value="VENUE_STATUS">Venue Status</option>
                <option value="LOCAL_EVENT">Local Event</option>
                <option value="PRODUCT_AVAILABILITY">Product Availability</option>
                <option value="CROWD_DENSITY">Crowd Density</option>
                <option value="WEATHER_ON_SITE">Weather on Site</option>
                <option value="PHOTO_VERIFICATION">Photo Verification</option>
                <option value="GENERAL_OBSERVATION">General Observation</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency</Label>
              <select
                id="urgency"
                className="flex h-10 w-full rounded-md border border-[var(--scoutx-border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--scoutx-primary)]"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                disabled={isLoading}
              >
                <option value="LOW">Low</option>
                <option value="NORMAL">Normal</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="budget">Budget (VND)</Label>
              <Input
                id="budget"
                type="number"
                step="1"
                required
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="radius">Radius (Meters)</Label>
              <Input
                id="radius"
                type="number"
                required
                value={radiusMeters}
                onChange={(e) => setRadiusMeters(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                required
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                required
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Required Tags (comma separated)</Label>
            <Input
              id="tags"
              placeholder="e.g., tokyo, shibuya, crossing"
              value={requiredTags}
              onChange={(e) => setRequiredTags(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresAt">Expires At</Label>
            <Input
              id="expiresAt"
              type="datetime-local"
              required
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              disabled={isLoading}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 border-t border-[var(--scoutx-border)] pt-6">
          <Button variant="outline" asChild disabled={isLoading}>
            <Link href="/missions">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isLoading || isUploading}>
            {isLoading ? "Creating..." : "Create Mission"}
          </Button>
        </div>
      </form>
    </div>
  );
}
