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
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE" | "INDIVIDUAL">("PUBLIC");
  const [publicLogs, setPublicLogs] = useState(true);
  const [recipientUsernamesInput, setRecipientUsernamesInput] = useState("");
  const [targetCitiesInput, setTargetCitiesInput] = useState("Ho Chi Minh City, Hanoi");
  const [targetGender, setTargetGender] = useState("ANY");
  const [targetAgeRange, setTargetAgeRange] = useState("ANY");
  const [targetExperienceLevel, setTargetExperienceLevel] = useState("ANY");
  const [targetLanguagesInput, setTargetLanguagesInput] = useState("English, Vietnamese");
  const [budgetAmount, setBudgetAmount] = useState("1000");
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
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
          if (Array.isArray(parsed.requiredTags) && parsed.requiredTags.length) {
            setRequiredTags(parsed.requiredTags.join(", "));
          }
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
    setFieldErrors({});
    setIsLoading(true);

    const clientErrors: Record<string, string> = {};
    if (!title.trim() || title.trim().length < 5) {
      clientErrors.title = "Mission Title is required (at least 5 characters).";
    }
    if (!description.trim() || description.trim().length < 10) {
      clientErrors.description = "Description is required (at least 10 characters).";
    }
    const amountCents = Math.round(parseFloat(budgetAmount));
    if (isNaN(amountCents) || amountCents <= 0) {
      clientErrors.budget = "Reward budget must be a positive number.";
    }
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      clientErrors.location = "Latitude and Longitude must be valid numbers.";
    }
    const radius = parseInt(radiusMeters);
    if (isNaN(radius) || radius <= 0) {
      clientErrors.radius = "Radius must be a positive integer.";
    }

    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      setError("Please correct the highlighted form fields below.");
      setIsLoading(false);
      const firstKey = Object.keys(clientErrors)[0];
      if (firstKey) {
        const el = document.getElementById(firstKey);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    const tags = requiredTags
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const recipientUsernames = recipientUsernamesInput
      .split(",")
      .map((u) => u.trim())
      .filter(Boolean);

    const targetCities = targetCitiesInput
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    const targetLanguages = targetLanguagesInput
      .split(",")
      .map((l) => l.trim())
      .filter(Boolean);

    const payload = {
      title,
      description,
      category,
      urgency,
      visibility,
      publicLogs,
      recipientUsernames,
      targetCities,
      targetGender,
      targetAgeRange,
      targetExperienceLevel,
      targetLanguages,
      budget: {
        amountCents,
        currency: "USD",
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
      let data: {
        error?: string;
        message?: string;
        fields?: Record<string, string>;
        id?: string;
      } | null = null;
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
        throw new Error(`API returned non-JSON response (${res.status}): ${text.slice(0, 200)}`);
      }

      if (!res.ok) {
        if (res.status === 401) {
          if (typeof window !== "undefined") {
            localStorage.setItem("fiwokan_pending_mission_draft", JSON.stringify(payload));
          }
          router.push("/sign-in?callbackUrl=/missions/new");
          return;
        }

        if (data?.fields && Object.keys(data.fields).length > 0) {
          setFieldErrors(data.fields);
          const firstFieldKey = Object.keys(data.fields)[0];
          if (firstFieldKey) {
            const el = document.getElementById(firstFieldKey);
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }

        throw new Error(data?.message || data?.error || "Failed to create mission");
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
          <div className="flex flex-col justify-between gap-3 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600 sm:flex-row sm:items-center">
            <div>{error}</div>
            {(error.includes("INSUFFICIENT_FUNDS") ||
              error.includes("Bạn đã hết lượt miễn phí")) && (
              <Button
                asChild
                size="sm"
                className="whitespace-nowrap bg-amber-500 font-bold text-white hover:bg-amber-600"
              >
                <Link href="/wallet">Nạp coin</Link>
              </Button>
            )}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="title"
              className={fieldErrors.title ? "font-bold text-red-600 dark:text-red-400" : ""}
            >
              Mission Title {fieldErrors.title && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id="title"
              required
              placeholder="e.g., Verify crowd density at Shibuya Crossing"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (fieldErrors.title) setFieldErrors((prev) => ({ ...prev, title: "" }));
              }}
              disabled={isLoading}
              className={fieldErrors.title ? "border-red-500 ring-2 ring-red-500/20" : ""}
            />
            {fieldErrors.title && (
              <p className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400">
                ⚠️ {fieldErrors.title}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="description"
              className={fieldErrors.description ? "font-bold text-red-600 dark:text-red-400" : ""}
            >
              Description {fieldErrors.description && <span className="text-red-500">*</span>}
            </Label>
            <textarea
              id="description"
              required
              rows={4}
              className={`flex w-full rounded-md border bg-[var(--scoutx-card)] px-3 py-2 text-sm text-[var(--scoutx-foreground)] placeholder-[var(--scoutx-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--scoutx-primary)] disabled:cursor-not-allowed disabled:opacity-50 ${
                fieldErrors.description
                  ? "border-red-500 ring-2 ring-red-500/20"
                  : "border-[var(--scoutx-border)]"
              }`}
              placeholder="Provide detailed instructions for the scout..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (fieldErrors.description)
                  setFieldErrors((prev) => ({ ...prev, description: "" }));
              }}
              disabled={isLoading}
            />
            {fieldErrors.description && (
              <p className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400">
                ⚠️ {fieldErrors.description}
              </p>
            )}
          </div>

          {/* Mission Visibility Controls */}
          <div className="space-y-3 rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-5 shadow-sm">
            <Label className="block text-base font-semibold text-[var(--scoutx-foreground)]">
              Mission Visibility & Audience Mode
            </Label>

            <div className="grid gap-3 sm:grid-cols-3">
              <label
                className={`flex cursor-pointer flex-col rounded-xl border p-3.5 transition-all ${
                  visibility === "PUBLIC"
                    ? "shadow-xs border-emerald-500 bg-emerald-500/10"
                    : "border-[var(--scoutx-border)]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="visibility"
                    value="PUBLIC"
                    checked={visibility === "PUBLIC"}
                    onChange={() => setVisibility("PUBLIC")}
                  />
                  <span className="text-sm font-bold text-[var(--scoutx-foreground)]">
                    🌐 Public
                  </span>
                </div>
                <span className="mt-1 text-[11px] text-[var(--scoutx-muted-foreground)]">
                  Visible to all scouts on Marketplace & Search
                </span>
              </label>

              <label
                className={`flex cursor-pointer flex-col rounded-xl border p-3.5 transition-all ${
                  visibility === "PRIVATE"
                    ? "shadow-xs border-amber-500 bg-amber-500/10"
                    : "border-[var(--scoutx-border)]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="visibility"
                    value="PRIVATE"
                    checked={visibility === "PRIVATE"}
                    onChange={() => setVisibility("PRIVATE")}
                  />
                  <span className="text-sm font-bold text-[var(--scoutx-foreground)]">
                    🔒 Private
                  </span>
                </div>
                <span className="mt-1 text-[11px] text-[var(--scoutx-muted-foreground)]">
                  Hidden from search; visible only to you & assigned worker
                </span>
              </label>

              <label
                className={`flex cursor-pointer flex-col rounded-xl border p-3.5 transition-all ${
                  visibility === "INDIVIDUAL"
                    ? "shadow-xs border-blue-500 bg-blue-500/10"
                    : "border-[var(--scoutx-border)]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="visibility"
                    value="INDIVIDUAL"
                    checked={visibility === "INDIVIDUAL"}
                    onChange={() => setVisibility("INDIVIDUAL")}
                  />
                  <span className="text-sm font-bold text-[var(--scoutx-foreground)]">
                    👤 Individual
                  </span>
                </div>
                <span className="mt-1 text-[11px] text-[var(--scoutx-muted-foreground)]">
                  Assigned directly to specific @username scouts
                </span>
              </label>
            </div>

            {visibility === "INDIVIDUAL" && (
              <div className="mt-3 space-y-1.5 border-t border-[var(--scoutx-border)] pt-3">
                <Label
                  htmlFor="recipients"
                  className="block text-xs font-bold uppercase tracking-wider text-[var(--scoutx-primary)]"
                >
                  Target @username scouts (comma separated)
                </Label>
                <Input
                  id="recipients"
                  placeholder="e.g. @alice, @bob, @scout_vietnam"
                  value={recipientUsernamesInput}
                  onChange={(e) => setRecipientUsernamesInput(e.target.value)}
                />
              </div>
            )}

            <div className="mt-2 flex items-center gap-2 border-t border-[var(--scoutx-border)] pt-2">
              <input
                type="checkbox"
                id="publicLogs"
                checked={publicLogs}
                onChange={(e) => setPublicLogs(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--scoutx-border)] text-emerald-600 focus:ring-emerald-500"
              />
              <label
                htmlFor="publicLogs"
                className="cursor-pointer text-xs font-medium text-[var(--scoutx-foreground)]"
              >
                Allow public activity logs & evidence when mission is Public
              </label>
            </div>
          </div>

          {/* Mission Targeting Attributes Section */}
          <div className="space-y-4 rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-5 shadow-sm">
            <div>
              <Label className="block text-base font-semibold text-[var(--scoutx-foreground)]">
                🎯 Who should see / receive this mission? (Targeting)
              </Label>
              <p className="mt-0.5 text-xs text-[var(--scoutx-muted-foreground)]">
                Targeting boosts matching ranking for qualified scouts without restricting public
                view.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label
                  htmlFor="targetCities"
                  className="text-xs font-bold text-[var(--scoutx-foreground)]"
                >
                  Target Cities / Areas
                </Label>
                <Input
                  id="targetCities"
                  placeholder="e.g. Hanoi, Ho Chi Minh City"
                  value={targetCitiesInput}
                  onChange={(e) => setTargetCitiesInput(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="targetGender"
                  className="text-xs font-bold text-[var(--scoutx-foreground)]"
                >
                  Target Gender
                </Label>
                <select
                  id="targetGender"
                  className="flex h-10 w-full rounded-md border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] px-3 py-2 text-sm text-[var(--scoutx-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--scoutx-primary)]"
                  value={targetGender}
                  onChange={(e) => setTargetGender(e.target.value)}
                >
                  <option value="ANY">Any Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="targetAgeRange"
                  className="text-xs font-bold text-[var(--scoutx-foreground)]"
                >
                  Target Age Range
                </Label>
                <select
                  id="targetAgeRange"
                  className="flex h-10 w-full rounded-md border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] px-3 py-2 text-sm text-[var(--scoutx-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--scoutx-primary)]"
                  value={targetAgeRange}
                  onChange={(e) => setTargetAgeRange(e.target.value)}
                >
                  <option value="ANY">Any Age</option>
                  <option value="18-24">18–24</option>
                  <option value="25-34">25–34</option>
                  <option value="35-49">35–49</option>
                  <option value="50+">50+</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor="targetExperienceLevel"
                  className="text-xs font-bold text-[var(--scoutx-foreground)]"
                >
                  Target Experience Level
                </Label>
                <select
                  id="targetExperienceLevel"
                  className="flex h-10 w-full rounded-md border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] px-3 py-2 text-sm text-[var(--scoutx-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--scoutx-primary)]"
                  value={targetExperienceLevel}
                  onChange={(e) => setTargetExperienceLevel(e.target.value)}
                >
                  <option value="ANY">Any Experience Level</option>
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate+</option>
                  <option value="EXPERT">Expert</option>
                </select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label
                  htmlFor="targetLanguages"
                  className="text-xs font-bold text-[var(--scoutx-foreground)]"
                >
                  Required Languages
                </Label>
                <Input
                  id="targetLanguages"
                  placeholder="e.g. English, Vietnamese, Japanese"
                  value={targetLanguagesInput}
                  onChange={(e) => setTargetLanguagesInput(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Reference Media Attachments Section */}
          <div className="bg-[var(--scoutx-muted)]/50 space-y-3 rounded-2xl border border-[var(--scoutx-border)] p-5">
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
                      className="group relative overflow-hidden rounded-xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-2 shadow-sm"
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

                      <p className="mt-2 truncate text-center text-[11px] font-medium text-[var(--scoutx-foreground)]">
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
                className="flex h-10 w-full rounded-md border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] px-3 py-2 text-sm text-[var(--scoutx-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--scoutx-primary)]"
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
                className="flex h-10 w-full rounded-md border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] px-3 py-2 text-sm text-[var(--scoutx-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--scoutx-primary)]"
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
              <div className="flex items-center justify-between">
                <Label htmlFor="budget">Reward / Budget ($ USD)</Label>
                <span className="text-xs text-[var(--scoutx-muted-foreground)]">
                  Cents: {budgetAmount || 0}
                </span>
              </div>
              <Input
                id="budget"
                type="number"
                step="100"
                required
                value={budgetAmount}
                onChange={(e) => setBudgetAmount(e.target.value)}
                disabled={isLoading}
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {[
                  { label: "$2", cents: 200 },
                  { label: "$5", cents: 500 },
                  { label: "$10", cents: 1000 },
                  { label: "$20", cents: 2000 },
                  { label: "$50", cents: 5000 },
                ].map((tier) => (
                  <button
                    key={tier.cents}
                    type="button"
                    onClick={() => setBudgetAmount(String(tier.cents))}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${
                      budgetAmount === String(tier.cents)
                        ? "bg-[var(--scoutx-primary)] text-white"
                        : "bg-[var(--scoutx-muted)] text-[var(--scoutx-muted-foreground)] hover:bg-gray-200 dark:hover:bg-zinc-700"
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
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
          <Button
            type="button"
            variant="secondary"
            disabled={isLoading || isUploading}
            onClick={(e) => {
              if (visibility !== "INDIVIDUAL") setVisibility("PRIVATE");
              handleSubmit(e as unknown as React.FormEvent);
            }}
          >
            {isLoading ? "Saving..." : "Create Mission"}
          </Button>
          <Button
            type="button"
            disabled={isLoading || isUploading}
            onClick={(e) => {
              if (visibility !== "INDIVIDUAL") setVisibility("PUBLIC");
              handleSubmit(e as unknown as React.FormEvent);
            }}
          >
            {isLoading ? "Publishing..." : "Publish"}
          </Button>
        </div>
      </form>
    </div>
  );
}
