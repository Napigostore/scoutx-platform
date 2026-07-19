"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Label } from "@scoutx/ui";

export default function NewMissionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("STREET_CONDITIONS");
  const [urgency, setUrgency] = useState("NORMAL");
  const [budgetAmount, setBudgetAmount] = useState("50.00");
  const locationId = "00000000-0000-0000-0000-000000000001";
  const [latitude, setLatitude] = useState("35.658034");
  const [longitude, setLongitude] = useState("139.701636");
  const [radiusMeters, setRadiusMeters] = useState("1500");
  const [requiredTags, setRequiredTags] = useState("tokyo, shibuya");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/sign-in");
    }
    // Set default expiresAt to 7 days from now
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    setExpiresAt(defaultDate.toISOString().substring(0, 16));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/sign-in");
      return;
    }

    const amountCents = Math.round(parseFloat(budgetAmount) * 100);
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
    };

    try {
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create mission");
      }

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
              <Label htmlFor="budget">Budget (USD)</Label>
              <Input
                id="budget"
                type="number"
                step="0.01"
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
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create Mission"}
          </Button>
        </div>
      </form>
    </div>
  );
}
