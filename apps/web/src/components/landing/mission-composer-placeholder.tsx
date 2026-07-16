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

export function MissionComposerPlaceholder() {
  const { draft, setDraft, setComposerFocused, resetDraft } = useMissionComposerStore();

  const form = useForm<ComposerFormValues>({
    resolver: zodResolver(composerSchema),
    defaultValues: draft,
    mode: "onBlur",
  });

  const onSubmit = form.handleSubmit((values) => {
    setDraft(values);
    form.reset(values);
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
            Drafts stay local until publishing is enabled for your account.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
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
            <Button type="submit">Save draft</Button>
          </div>
        </div>

        <MatchPreview />
      </motion.form>
    </section>
  );
}
