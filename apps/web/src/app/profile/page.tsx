"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@scoutx/ui";
import { STANDARD_CITIES, type UserProfileResponse } from "@/lib/user-profile-service";
import { CityMapPicker } from "@/components/profile/city-map-picker";

const MISSION_CATEGORIES = [
  { id: "PHOTO_VERIFICATION", label: "Photo Verification" },
  { id: "STREET_CONDITIONS", label: "Street Conditions" },
  { id: "VENUE_STATUS", label: "Venue Status" },
  { id: "PRODUCT_AVAILABILITY", label: "Product Availability" },
  { id: "CROWD_DENSITY", label: "Crowd Density" },
  { id: "WEATHER_ON_SITE", label: "Weather On-Site" },
  { id: "LOCAL_EVENT", label: "Local Event" },
  { id: "GENERAL_OBSERVATION", label: "General Observation" },
];

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  // Edit form state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [expertise, setExpertise] = useState("");
  const [livingCity, setLivingCity] = useState("Ho Chi Minh City");
  const [livingCountry, setLivingCountry] = useState("Vietnam");
  const [livingCountryCode, setLivingCountryCode] = useState("VN");
  const [latitude, setLatitude] = useState(10.7769);
  const [longitude, setLongitude] = useState(106.7009);
  const [availableForMissions, setAvailableForMissions] = useState(true);
  const [missionCities, setMissionCities] = useState<string[]>(["Ho Chi Minh City"]);
  const [skillsInput, setSkillsInput] = useState("");
  const [preferredMissionTypes, setPreferredMissionTypes] = useState<string[]>([]);
  const [legalName, setLegalName] = useState("");
  const [phone, setPhone] = useState("");
  const [privateNotes, setPrivateNotes] = useState("");

  const [emailNotifyActivity, setEmailNotifyActivity] = useState(true);
  const [emailNotifyEvidence, setEmailNotifyEvidence] = useState(true);
  const [emailNotifyReward, setEmailNotifyReward] = useState(true);
  const [emailNotifyDispute, setEmailNotifyDispute] = useState(true);
  const [emailNotifySystem, setEmailNotifySystem] = useState(true);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError("");

    const headers: Record<string, string> = {};
    const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    try {
      const res = await fetch("/api/profile", { headers, cache: "no-store" });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/sign-in?callbackUrl=/profile");
          return;
        }
        throw new Error(data.error || "Failed to load profile");
      }

      setProfile(data);
      initFormState(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const initFormState = (p: UserProfileResponse) => {
    setDisplayName(p.user.displayName || "");
    setBio(p.publicProfile.bio || "");
    setExpertise(p.publicProfile.expertise || "");
    setLivingCity(p.publicProfile.livingCity || "Ho Chi Minh City");
    setLivingCountry(p.publicProfile.livingCountry || "Vietnam");
    setLivingCountryCode(p.publicProfile.livingCountryCode || "VN");
    setLatitude(p.publicProfile.latitude ?? 10.7769);
    setLongitude(p.publicProfile.longitude ?? 106.7009);
    setAvailableForMissions(p.publicProfile.availableForMissions ?? true);
    setMissionCities(p.publicProfile.missionCities || ["Ho Chi Minh City"]);
    setSkillsInput((p.publicProfile.skills || []).join(", "));
    setPreferredMissionTypes(p.publicProfile.preferredMissionTypes || []);
    if (p.privateContact) {
      setLegalName(p.privateContact.legalName || "");
      setPhone(p.privateContact.phone || "");
      setPrivateNotes(p.privateContact.privateNotes || "");
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setAvatarError("");

    const headers: Record<string, string> = {};
    const token = localStorage.getItem("accessToken");
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        headers,
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Avatar upload failed");
      }

      if (profile) {
        setProfile({
          ...profile,
          user: {
            ...profile.user,
            avatarUrl: data.avatarUrl,
          },
        });
      }
    } catch (err: unknown) {
      setAvatarError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    const token = localStorage.getItem("accessToken");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const skillsArray = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      displayName,
      bio,
      expertise,
      livingCity,
      livingCountry,
      livingCountryCode,
      latitude,
      longitude,
      availableForMissions,
      missionCities,
      skills: skillsArray,
      preferredMissionTypes,
      legalName,
      phone,
      privateNotes,
      notificationSettings: {
        emailNotifyActivity,
        emailNotifyEvidence,
        emailNotifyReward,
        emailNotifyDispute,
        emailNotifySystem,
      },
    };

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers,
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      if (data.profile) {
        setProfile(data.profile);
      }
      setIsEditing(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleMissionCity = (city: string) => {
    if (missionCities.includes(city)) {
      if (missionCities.length > 1) {
        setMissionCities(missionCities.filter((c) => c !== city));
      }
    } else {
      setMissionCities([...missionCities, city]);
    }
  };

  const toggleCategory = (catId: string) => {
    if (preferredMissionTypes.includes(catId)) {
      setPreferredMissionTypes(preferredMissionTypes.filter((c) => c !== catId));
    } else {
      setPreferredMissionTypes([...preferredMissionTypes, catId]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-sm font-semibold text-[var(--scoutx-muted-foreground)]">
          Loading User Profile...
        </p>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-600 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300">
          <h3 className="font-bold">Failed to load profile</h3>
          <p className="mt-1 text-sm">{error}</p>
          <Button className="mt-4" onClick={fetchProfile}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const { user, publicProfile: pub, performance: perf, trust, privateContact } = profile;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Navigation Breadcrumb */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/missions"
          className="text-xs font-bold text-[var(--scoutx-primary)] hover:underline"
        >
          ← Back to Mission Marketplace
        </Link>
        <span className="text-xs font-semibold text-[var(--scoutx-muted-foreground)]">
          Member since{" "}
          {new Date(user.memberSince).toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>

      {/* Main Profile Header Card */}
      <div className="rounded-3xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-5 sm:items-center">
            {/* Avatar container */}
            <div className="group relative flex-shrink-0">
              <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-[var(--scoutx-primary)] bg-[var(--scoutx-muted)] shadow">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt={user.displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-black text-[var(--scoutx-primary)]">
                    {user.displayName.substring(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <label
                htmlFor="avatar-upload-input"
                className="absolute bottom-0 right-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[var(--scoutx-primary)] text-xs text-white shadow transition-transform hover:scale-105"
                title="Upload avatar"
              >
                📷
              </label>
              <input
                id="avatar-upload-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={isUploadingAvatar}
              />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-2xl font-black text-[var(--scoutx-foreground)] sm:text-3xl">
                  {user.displayName}
                </h1>
                <span className="bg-[var(--scoutx-primary)]/10 rounded-full px-3 py-1 text-xs font-bold text-[var(--scoutx-primary)]">
                  {user.role}
                </span>
              </div>
              <p className="mt-1 max-w-xl text-sm text-[var(--scoutx-muted-foreground)]">
                {pub.bio}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <Button variant="outline" onClick={() => setIsEditing(true)}>
              ✏️ Edit Profile
            </Button>
            {isUploadingAvatar && (
              <span className="animate-pulse text-xs text-[var(--scoutx-primary)]">
                Uploading avatar...
              </span>
            )}
            {avatarError && <span className="text-xs text-red-500">{avatarError}</span>}
          </div>
        </div>

        {/* Header Trust Badge Banner */}
        <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-[var(--scoutx-border)] pt-6">
          <div>
            <span className="block text-xs font-semibold text-[var(--scoutx-muted-foreground)]">
              Trust Rating
            </span>
            <div className="mt-0.5 flex items-center gap-2">
              <span className="text-lg font-bold tracking-wider text-amber-500">
                {trust.scoreStars}
              </span>
              <span className="text-sm font-black text-[var(--scoutx-foreground)]">
                {trust.scoreLabel}
              </span>
            </div>
          </div>

          <div className="hidden h-8 w-px bg-[var(--scoutx-border)] sm:block" />

          <div>
            <span className="block text-xs font-semibold text-[var(--scoutx-muted-foreground)]">
              Living Location
            </span>
            <span className="block text-sm font-bold text-[var(--scoutx-foreground)]">
              📍 {pub.livingCity}, {pub.livingCountry}
            </span>
          </div>

          <div className="hidden h-8 w-px bg-[var(--scoutx-border)] sm:block" />

          <div>
            <span className="block text-xs font-semibold text-[var(--scoutx-muted-foreground)]">
              Global Scout Map Status
            </span>
            <span
              className={`mt-0.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-bold ${
                pub.availableForMissions
                  ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "border border-zinc-500/20 bg-zinc-500/10 text-zinc-500"
              }`}
            >
              {pub.availableForMissions ? "⚡ Available for Missions" : "⏸️ Offline / Hidden"}
            </span>
          </div>

          <div className="hidden h-8 w-px bg-[var(--scoutx-border)] sm:block" />

          <div>
            <span className="block text-xs font-semibold text-[var(--scoutx-muted-foreground)]">
              Specialized Field
            </span>
            <span className="text-sm font-bold text-[var(--scoutx-foreground)]">
              🎯 {pub.expertise}
            </span>
          </div>
        </div>
      </div>

      {/* Performance / Trust Indicators Grid */}
      <div className="mt-8">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--scoutx-primary)]">
          VERIFIED PERFORMANCE & TRUST INDICATORS
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {/* Card 1: Completed */}
          <div className="rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-4 shadow-sm">
            <span className="text-xs font-semibold text-[var(--scoutx-muted-foreground)]">
              Completed
            </span>
            <div className="mt-2 text-2xl font-black text-[var(--scoutx-foreground)]">
              {perf.completedMissions}{" "}
              <span className="text-xs font-medium text-[var(--scoutx-muted-foreground)]">
                missions
              </span>
            </div>
          </div>

          {/* Card 2: Success Rate */}
          <div className="rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-4 shadow-sm">
            <span className="text-xs font-semibold text-[var(--scoutx-muted-foreground)]">
              Success Rate
            </span>
            <div className="mt-2 text-2xl font-black text-[var(--scoutx-foreground)]">
              {perf.successRateFormatted}
            </div>
            {perf.successRatePercentage !== null && (
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--scoutx-muted)]">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${perf.successRatePercentage}%` }}
                />
              </div>
            )}
          </div>

          {/* Card 3: Avg Completion Time */}
          <div className="rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-4 shadow-sm">
            <span className="text-xs font-semibold text-[var(--scoutx-muted-foreground)]">
              Avg. Completion
            </span>
            <div className="mt-2 text-2xl font-black text-[var(--scoutx-foreground)]">
              {perf.avgCompletionTimeFormatted}
            </div>
          </div>

          {/* Card 4: Total Earned */}
          <div className="rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-4 shadow-sm">
            <span className="text-xs font-semibold text-[var(--scoutx-muted-foreground)]">
              Total Earned
            </span>
            <div className="mt-2 text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {perf.totalEarnedFormatted}
            </div>
          </div>

          {/* Card 5: On-Time Rate */}
          <div className="rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-4 shadow-sm">
            <span className="text-xs font-semibold text-[var(--scoutx-muted-foreground)]">
              On-time Rate
            </span>
            <div className="mt-2 text-2xl font-black text-[var(--scoutx-foreground)]">
              {perf.onTimeRateFormatted}
            </div>
          </div>
        </div>
      </div>

      {/* Expertise, Skills & Mission Scope */}
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Left Column: Skills & Preferred Types */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-6 shadow-sm">
            <h3 className="font-display text-lg font-bold text-[var(--scoutx-foreground)]">
              EXPERTISE & SKILLS
            </h3>

            <div className="mt-4 space-y-4">
              <div>
                <span className="block text-xs font-semibold text-[var(--scoutx-muted-foreground)]">
                  Primary Specialization:
                </span>
                <span className="mt-1 inline-block text-sm font-bold text-[var(--scoutx-foreground)]">
                  {pub.expertise}
                </span>
              </div>

              <div>
                <span className="mb-2 block text-xs font-semibold text-[var(--scoutx-muted-foreground)]">
                  Skills & Capabilities:
                </span>
                <div className="flex flex-wrap gap-2">
                  {pub.skills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="rounded-full bg-[var(--scoutx-muted)] px-3 py-1 text-xs font-bold text-[var(--scoutx-foreground)]"
                    >
                      ⚡ {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="mb-2 block text-xs font-semibold text-[var(--scoutx-muted-foreground)]">
                  Preferred Mission Categories:
                </span>
                <div className="flex flex-wrap gap-2">
                  {pub.preferredMissionTypes.map((cat, idx) => (
                    <span
                      key={idx}
                      className="border-[var(--scoutx-primary)]/30 bg-[var(--scoutx-primary)]/5 rounded-full border px-3 py-1 text-xs font-bold text-[var(--scoutx-primary)]"
                    >
                      🎯 {cat.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Mission Cities & Coverage Scope */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-6 shadow-sm">
            <h3 className="font-display text-lg font-bold text-[var(--scoutx-foreground)]">
              GEOGRAPHIC COVERAGE
            </h3>

            <div className="mt-4 space-y-4">
              <div>
                <span className="block text-xs font-semibold text-[var(--scoutx-muted-foreground)]">
                  Primary Living City:
                </span>
                <span className="mt-1 block text-sm font-bold text-[var(--scoutx-foreground)]">
                  🏢 {pub.livingCity}
                </span>
              </div>

              <div>
                <span className="mb-2 block text-xs font-semibold text-[var(--scoutx-muted-foreground)]">
                  Active Mission Coverage Cities:
                </span>
                <div className="flex flex-wrap gap-2">
                  {pub.missionCities.map((city, idx) => (
                    <span
                      key={idx}
                      className="shadow-xs rounded-xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] px-3 py-1.5 text-xs font-bold text-[var(--scoutx-foreground)]"
                    >
                      📍 {city}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Private Contact Section (Owner + Admin ONLY) */}
          {privateContact && (
            <div className="rounded-3xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm dark:border-amber-900/50 dark:bg-amber-950/20">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-sm font-bold text-amber-900 dark:text-amber-300">
                  🔒 PRIVATE CONTACT INFORMATION
                </h3>
                <span className="rounded-full bg-amber-200/60 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-800 dark:bg-amber-900/60 dark:text-amber-200">
                  Confidential
                </span>
              </div>
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                Visible only to you and system administrators. Omitted from public APIs and
                Marketplace views.
              </p>

              <div className="mt-4 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                <div>
                  <span className="block font-semibold text-amber-900 dark:text-amber-300">
                    Legal Name:
                  </span>
                  <span className="font-bold text-amber-950 dark:text-amber-100">
                    {privateContact.legalName || "Not specified"}
                  </span>
                </div>
                <div>
                  <span className="block font-semibold text-amber-900 dark:text-amber-300">
                    Email Address:
                  </span>
                  <span className="font-bold text-amber-950 dark:text-amber-100">
                    {privateContact.email}
                  </span>
                </div>
                <div>
                  <span className="block font-semibold text-amber-900 dark:text-amber-300">
                    Phone Number:
                  </span>
                  <span className="font-bold text-amber-950 dark:text-amber-100">
                    {privateContact.phone || "Not specified"}
                  </span>
                </div>
                {privateContact.privateNotes && (
                  <div>
                    <span className="block font-semibold text-amber-900 dark:text-amber-300">
                      Private Notes:
                    </span>
                    <span className="font-bold text-amber-950 dark:text-amber-100">
                      {privateContact.privateNotes}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Public Verified Work History */}
      <div className="mt-8 rounded-3xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-[var(--scoutx-border)] pb-4">
          <div>
            <h3 className="font-display text-lg font-bold text-[var(--scoutx-foreground)]">
              📜 PUBLIC VERIFIED WORK HISTORY
            </h3>
            <p className="text-xs text-[var(--scoutx-muted-foreground)]">
              Verified public missions completed by this scout. Private and individual missions are
              strictly excluded.
            </p>
          </div>
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            {profile.publicWorkHistory?.length || 0} Public Mission(s)
          </span>
        </div>

        {!profile.publicWorkHistory || profile.publicWorkHistory.length === 0 ? (
          <div className="py-8 text-center text-xs text-[var(--scoutx-muted-foreground)]">
            No public verified mission history available.
          </div>
        ) : (
          <div className="mt-4 divide-y divide-[var(--scoutx-border)]">
            {profile.publicWorkHistory.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <Link
                    href={`/missions/${item.id}`}
                    className="text-sm font-bold text-[var(--scoutx-foreground)] hover:text-[var(--scoutx-primary)] hover:underline"
                  >
                    {item.title}
                  </Link>
                  <div className="mt-1 flex items-center gap-2 text-xs text-[var(--scoutx-muted-foreground)]">
                    <span className="rounded-full bg-[var(--scoutx-muted)] px-2 py-0.5 text-[10px] font-semibold uppercase">
                      {item.category.replace(/_/g, " ")}
                    </span>
                    <span>• Completed on {new Date(item.completedDate).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:text-right">
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    {item.rewardFormatted}
                  </span>
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-600">
                    ✓ Verified
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditing && (
        <div className="backdrop-blur-xs fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4">
          <div className="my-8 w-full max-w-2xl rounded-3xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] p-6 shadow-xl sm:p-8">
            <div className="flex items-center justify-between border-b border-[var(--scoutx-border)] pb-4">
              <h2 className="font-display text-xl font-bold text-[var(--scoutx-foreground)]">
                Edit Your Profile
              </h2>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-lg font-bold text-[var(--scoutx-muted-foreground)] hover:text-[var(--scoutx-foreground)]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-6 space-y-5">
              {/* Display Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--scoutx-foreground)]">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] px-4 py-2.5 text-sm text-[var(--scoutx-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--scoutx-primary)]"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--scoutx-foreground)]">
                  Bio / Introduction
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="mt-1.5 w-full rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] px-4 py-2.5 text-sm text-[var(--scoutx-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--scoutx-primary)]"
                />
              </div>

              {/* Expertise */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--scoutx-foreground)]">
                  Specialized Field / Expertise
                </label>
                <input
                  type="text"
                  value={expertise}
                  onChange={(e) => setExpertise(e.target.value)}
                  placeholder="e.g. Field Verification, Retail Audit, On-Site Inspection"
                  className="mt-1.5 w-full rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] px-4 py-2.5 text-sm text-[var(--scoutx-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--scoutx-primary)]"
                />
              </div>

              {/* Global City & Map Location Picker */}
              <CityMapPicker
                selectedCity={livingCity}
                selectedCountry={livingCountry}
                selectedCountryCode={livingCountryCode}
                latitude={latitude}
                longitude={longitude}
                availableForMissions={availableForMissions}
                onLocationChange={(loc) => {
                  setLivingCity(loc.city);
                  setLivingCountry(loc.country);
                  setLivingCountryCode(loc.countryCode);
                  setLatitude(loc.latitude);
                  setLongitude(loc.longitude);
                }}
                onAvailabilityChange={(avail) => setAvailableForMissions(avail)}
              />

              {/* Mission Cities Coverage */}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--scoutx-foreground)]">
                  Active Coverage Cities
                </label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {STANDARD_CITIES.map((city) => {
                    const active = missionCities.includes(city);
                    return (
                      <button
                        key={city}
                        type="button"
                        onClick={() => toggleMissionCity(city)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors ${
                          active
                            ? "bg-[var(--scoutx-primary)] text-white shadow-sm"
                            : "bg-[var(--scoutx-muted)] text-[var(--scoutx-muted-foreground)] hover:bg-[var(--scoutx-secondary)]"
                        }`}
                      >
                        {active ? "✓ " : "+ "}
                        {city}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--scoutx-foreground)]">
                  Skills & Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  placeholder="geotagged, fast_responder, field_audit, photo_inspection"
                  className="mt-1.5 w-full rounded-2xl border border-[var(--scoutx-border)] bg-[var(--scoutx-card)] px-4 py-2.5 text-sm text-[var(--scoutx-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--scoutx-primary)]"
                />
              </div>

              {/* Preferred Mission Categories */}
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-[var(--scoutx-foreground)]">
                  Preferred Mission Categories
                </label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {MISSION_CATEGORIES.map((cat) => {
                    const active = preferredMissionTypes.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={`rounded-full px-3 py-1 text-xs font-bold transition-colors ${
                          active
                            ? "bg-[var(--scoutx-primary)] text-white shadow-sm"
                            : "bg-[var(--scoutx-muted)] text-[var(--scoutx-muted-foreground)] hover:bg-[var(--scoutx-secondary)]"
                        }`}
                      >
                        {active ? "✓ " : "+ "}
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Private Contact Fields */}
              <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
                <span className="block text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                  🔒 Private Information (Only visible to you & Admin)
                </span>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-amber-900 dark:text-amber-300">
                      Legal Name
                    </label>
                    <input
                      type="text"
                      value={legalName}
                      onChange={(e) => setLegalName(e.target.value)}
                      placeholder="Your full legal name"
                      className="mt-1 w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-amber-800 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-amber-900 dark:text-amber-300">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+84 90 123 4567"
                      className="mt-1 w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-amber-800 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-amber-900 dark:text-amber-300">
                    Private Notes / Contact Instructions
                  </label>
                  <input
                    type="text"
                    value={privateNotes}
                    onChange={(e) => setPrivateNotes(e.target.value)}
                    placeholder="e.g. Preferred contact method or Telegram ID"
                    className="mt-1 w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs text-slate-900 focus:outline-none dark:border-amber-800 dark:bg-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Notification Settings */}
              <div className="space-y-4 rounded-xl border border-[var(--scoutx-border)] bg-[var(--scoutx-background)] p-4">
                <h3 className="border-b border-[var(--scoutx-border)] pb-2 font-bold text-[var(--scoutx-foreground)]">
                  Email Notifications
                </h3>

                <div className="space-y-3">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={emailNotifyActivity}
                      onChange={(e) => setEmailNotifyActivity(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[var(--scoutx-primary)] focus:ring-[var(--scoutx-primary)]"
                    />
                    <span className="text-sm font-semibold text-[var(--scoutx-foreground)]">
                      Mission Activity (New missions, assigned, completed)
                    </span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={emailNotifyEvidence}
                      onChange={(e) => setEmailNotifyEvidence(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[var(--scoutx-primary)] focus:ring-[var(--scoutx-primary)]"
                    />
                    <span className="text-sm font-semibold text-[var(--scoutx-foreground)]">
                      Evidence Uploaded (When scouts submit proof)
                    </span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={emailNotifyReward}
                      onChange={(e) => setEmailNotifyReward(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[var(--scoutx-primary)] focus:ring-[var(--scoutx-primary)]"
                    />
                    <span className="text-sm font-semibold text-[var(--scoutx-foreground)]">
                      Reward Requests & Payments
                    </span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={emailNotifyDispute}
                      onChange={(e) => setEmailNotifyDispute(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[var(--scoutx-primary)] focus:ring-[var(--scoutx-primary)]"
                    />
                    <span className="text-sm font-semibold text-[var(--scoutx-foreground)]">
                      Disputes & Voting
                    </span>
                  </label>

                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={emailNotifySystem}
                      onChange={(e) => setEmailNotifySystem(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-[var(--scoutx-primary)] focus:ring-[var(--scoutx-primary)]"
                    />
                    <span className="text-sm font-semibold text-[var(--scoutx-foreground)]">
                      System Updates
                    </span>
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 border-t border-[var(--scoutx-border)] pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Profile"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
