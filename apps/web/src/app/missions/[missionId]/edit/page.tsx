"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Input, Label } from "@scoutx/ui";

export default function EditMissionPage({ params }: { params: Promise<{ missionId: string }> }) {
  const router = useRouter();
  const { missionId } = use(params);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("STREET_CONDITIONS");
  const [urgency, setUrgency] = useState("NORMAL");
  const [budgetAmount, setBudgetAmount] = useState("");
  const [locationId, setLocationId] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radiusMeters, setRadiusMeters] = useState("");
  const [requiredTags, setRequiredTags] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/sign-in");
      return;
    }

    fetch(`/api/missions/${missionId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch mission details");
        }
        if (data.status !== "DRAFT") {
          throw new Error("Only draft missions can be edited");
        }
        setTitle(data.title);
        setDescription(data.description);
        setCategory(data.category);
        setUrgency(data.urgency);
        setBudgetAmount((data.budget.amountCents / 100).toFixed(2));
        setLocationId(data.locationId);
        setLatitude(data.coordinates.latitude.toString());
        setLongitude(data.coordinates.longitude.toString());
        setRadiusMeters(data.radiusMeters.toString());
        setRequiredTags(data.requiredTags.join(", "));
        setExpiresAt(new Date(data.expiresAt).toISOString().substring(0, 16));
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [missionId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSaving(true);

    const token = localStorage.getItem("accessToken");
    if (!token) {
      router.push("/sign-in");
      return;
    }

    const amountCents = Math.round(parseFloat(budgetAmount) * 100);
    if (isNaN(amountCents) || amountCents <= 0) {
      setError("Budget must be a positive number");
      setIsSaving(false);
      return;
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) {
      setError("Latitude and Longitude must be valid numbers");
      setIsSaving(false);
      return;
    }

    const radius = parseInt(radiusMeters);
    if (isNaN(radius) || radius <= 0) {
      setError("Radius must be a positive integer");
      setIsSaving(false);
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
      const res = await fetch(`/api/missions/${missionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update mission");
      }

      router.push(`/missions/${missionId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-[var(--scoutx-muted-foreground)]">Loading mission details...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="border-b border-[var(--scoutx-border)] pb-6">
        <h1 className="font-display text-3xl font-bold text-[var(--scoutx-foreground)]">
          Edit Mission
        </h1>
        <p className="mt-2 text-sm text-[var(--scoutx-muted-foreground)]">
          Update your draft mission details
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              required
              rows={4}
              className="flex w-full rounded-md border border-[var(--scoutx-border)] bg-white px-3 py-2 text-sm placeholder-[var(--scoutx-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--scoutx-primary)] disabled:cursor-not-allowed disabled:opacity-50"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSaving}
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
                disabled={isSaving}
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
                disabled={isSaving}
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
                disabled={isSaving}
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
                disabled={isSaving}
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
                disabled={isSaving}
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
                disabled={isSaving}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Required Tags (comma separated)</Label>
            <Input
              id="tags"
              value={requiredTags}
              onChange={(e) => setRequiredTags(e.target.value)}
              disabled={isSaving}
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
              disabled={isSaving}
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 border-t border-[var(--scoutx-border)] pt-6">
          <Button variant="outline" asChild disabled={isSaving}>
            <Link href={`/missions/${missionId}`}>Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
