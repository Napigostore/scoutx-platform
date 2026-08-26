"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { MissionCategorySchema } from "@scoutx/types";
import { Button, Input, Label, Textarea } from "@scoutx/ui";

import { MatchPreview } from "@/components/landing/match-preview";
import { useMissionComposerStore } from "@/stores/mission-composer";

const composerSchema = z.object({
  title: z.string().min(3, "Title needs at least 3 characters").max(160),
  description: z.string().min(10, "Add a bit more detail").max(4000),
  category: MissionCategorySchema,
  cityQuery: z.string().min(2, "Enter a city or place").max(120),
});

type ComposerFormValues = z.infer<typeof composerSchema>;

const categoryOptions = MissionCategorySchema.options.map((value) => ({
  value,
  label: value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" "),
}));

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MissionComposerPlaceholder() {
  const router = useRouter();
  const { draft, setDraft, setComposerFocused, resetDraft } = useMissionComposerStore();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ComposerFormValues>({
    resolver: zodResolver(composerSchema),
    defaultValues: draft,
    mode: "onBlur",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setError("");
    setIsSubmitting(true);
    setDraft(values);

    const defaultExpiresAt = new Date();
    defaultExpiresAt.setDate(defaultExpiresAt.getDate() + 7);

    const payload = {
      title: values.title,
      description: values.description,
      category: values.category,
      urgency: "NORMAL",
      budget: {
        amountCents: 1000,
        currency: "USD",
      },
      locationId: "00000000-0000-0000-0000-000000000001",
      coordinates: {
        latitude: 10.762622,
        longitude: 106.660172,
      },
      radiusMeters: 1500,
      requiredTags: values.cityQuery
        ? values.cityQuery
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : ["general"],
      expiresAt: defaultExpiresAt.toISOString(),
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
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
          // Unauthenticated: draft saved in localStorage, navigate to sign-in
          if (typeof window !== "undefined") {
            localStorage.setItem("fiwokan_pending_mission_draft", JSON.stringify(payload));
          }
          router.push("/sign-in?callbackUrl=/missions/new");
          return;
        }
        throw new Error(data?.error || "Failed to save draft");
      }

      // Success: draft persisted to DB! Remove pending draft, clear store, and navigate to missions
      if (typeof window !== "undefined") {
        localStorage.removeItem("fiwokan_pending_mission_draft");
      }
      resetDraft();
      router.push("/missions");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <section id="composer" className="section-shell scroll-mt-24 py-20">
      <motion.div
        className="mx-auto max-w-3xl space-y-4 text-center"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.5 }}
      >
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--scoutx-primary)]">
          Mission composer
        </p>
        <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
          Describe what you need to know on the ground
        </h2>
        <p className="text-[var(--scoutx-muted-foreground)]">
          Draft a mission now. Matching, escrow, and scout assignment connect once you publish.
        </p>
      </motion.div>

      <motion.form
        onSubmit={onSubmit}
        className="mx-auto mt-10 max-w-3xl space-y-5 rounded-2xl border border-[var(--scoutx-border)] bg-white/80 p-6 shadow-[0_20px_50px_rgba(18,32,26,0.06)] backdrop-blur-sm sm:p-8"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.55, delay: 0.08 }}
        onFocusCapture={() => setComposerFocused(true)}
        onBlurCapture={() => setComposerFocused(false)}
      >
        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="title">Mission title</Label>
          <Input
            id="title"
            placeholder="Is the south entrance still open after 9pm?"
            {...form.register("title", {
              onChange: (event) => setDraft({ title: event.target.value }),
            })}
          />
          {form.formState.errors.title ? (
            <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">What should the scout verify?</Label>
          <Textarea
            id="description"
            placeholder="Include timing, landmarks, and the exact observation you need."
            {...form.register("description", {
              onChange: (event) => setDraft({ description: event.target.value }),
            })}
          />
          {form.formState.errors.description ? (
            <p className="text-sm text-red-600">{form.formState.errors.description.message}</p>
          ) : null}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <select
              id="category"
              className="flex h-10 w-full rounded-md border border-[var(--scoutx-border)] bg-[var(--scoutx-background)] px-3 text-sm"
              {...form.register("category", {
                onChange: (event) =>
                  setDraft({ category: event.target.value as ComposerFormValues["category"] }),
              })}
            >
              {categoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cityQuery">City or place</Label>
            <Input
              id="cityQuery"
              placeholder="Tokyo, Shibuya Crossing"
              {...form.register("cityQuery", {
                onChange: (event) => setDraft({ cityQuery: event.target.value }),
              })}
            />
            {form.formState.errors.cityQuery ? (
              <p className="text-sm text-red-600">{form.formState.errors.cityQuery.message}</p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <p className="text-sm text-[var(--scoutx-muted-foreground)]">
            Saving a draft creates a private mission draft in your account.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => {
                resetDraft();
                form.reset({
                  title: "",
                  description: "",
                  category: "GENERAL_OBSERVATION",
                  cityQuery: "",
                });
              }}
            >
              Clear
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save draft"}
            </Button>
          </div>
        </div>

        <MatchPreview />
      </motion.form>
    </section>
  );
}
