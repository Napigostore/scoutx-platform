/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";

export interface PublicWorkHistoryItem {
  id: string;
  title: string;
  category: string;
  completedDate: string;
  rewardFormatted: string;
  status: string;
}

export interface UserProfileResponse {
  user: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    role: string;
    memberSince: string;
    notificationSettings: {
      emailNotifyActivity: boolean;
      emailNotifyEvidence: boolean;
      emailNotifyReward: boolean;
      emailNotifyDispute: boolean;
      emailNotifySystem: boolean;
    };
  };
  publicProfile: {
    bio: string;
    expertise: string;
    livingCity: string;
    livingCountry: string;
    livingCountryCode: string;
    latitude: number;
    longitude: number;
    availableForMissions: boolean;
    missionCities: string[];
    skills: string[];
    preferredMissionTypes: string[];
    gender: string;
    ageRange: string;
    languages: string[];
    experienceLevel: string;
    availabilityType: string;
    education: string;
    certifications: string[];
    yearsOfExperience: number;
  };
  performance: {
    completedMissions: number;
    successRateFormatted: string; // e.g. "96%" or "N/A"
    successRatePercentage: number | null;
    avgCompletionTimeFormatted: string; // e.g. "2h 18m" or "N/A"
    totalEarnedFormatted: string; // e.g. "$1,240"
    onTimeRateFormatted: string; // e.g. "94%" or "N/A"
    hasEnoughData: boolean;
  };
  trust: {
    scoreNumeric: number | null; // e.g. 92
    scoreStars: string; // e.g. "★★★★★"
    scoreLabel: string; // e.g. "92/100" or "No history"
    ratingOutOfFive: number | null; // e.g. 4.6
  };
  publicWorkHistory: PublicWorkHistoryItem[];
  privateContact?: {
    legalName: string;
    email: string;
    phone: string;
    privateNotes: string;
  };
}

export interface UserProfileUpdateInput {
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  expertise?: string;
  livingCity?: string;
  livingCountry?: string;
  livingCountryCode?: string;
  latitude?: number;
  longitude?: number;
  availableForMissions?: boolean;
  missionCities?: string[];
  skills?: string[];
  preferredMissionTypes?: string[];
  gender?: string;
  birthYear?: number;
  languages?: string[];
  experienceLevel?: string;
  availabilityType?: string;
  education?: string;
  certifications?: string[];
  yearsOfExperience?: number;
  legalName?: string;
  phone?: string;
  privateNotes?: string;
}

export const STANDARD_CITIES = [
  "Ho Chi Minh City",
  "Hanoi",
  "Da Nang",
  "Hai Phong",
  "Can Tho",
  "Nha Trang",
  "Hue",
  "Vung Tau",
  "Tokyo",
  "Berlin",
] as const;

export async function getUserProfile(
  targetUserId: string,
  requestingUserId?: string | null,
  requestingUserRole?: string | null,
): Promise<UserProfileResponse | null> {
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: {
      userProfile: true,
      scoutProfile: true,
    },
  });

  if (!user) {
    return null;
  }

  // Find user's completed / matched missions & submissions
  const scoutProfileId = user.scoutProfile?.id;

  const [submissions] = await Promise.all([
    prisma.missionSubmission.findMany({
      where: { userId: user.id },
      include: {
        mission: {
          select: {
            id: true,
            title: true,
            category: true,
            visibility: true,
            createdAt: true,
            expiresAt: true,
            budgetCents: true,
            currency: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    scoutProfileId
      ? prisma.mission.findMany({
          where: { assignedScoutId: scoutProfileId },
          select: {
            id: true,
            createdAt: true,
            expiresAt: true,
            budgetCents: true,
            currency: true,
            status: true,
            updatedAt: true,
          },
        })
      : Promise.resolve([]),
  ]);

  // Compute completed missions
  const completedSubmissions = submissions.filter(
    (s) => s.verified || s.mission.status === "COMPLETED" || s.mission.status === "VERIFIED",
  );
  const rejectedSubmissions = submissions.filter(
    (s) =>
      s.rejectionReason ||
      (!s.verified && (s.mission.status === "CANCELLED" || s.mission.status === "EXPIRED")),
  );

  const completedCount = completedSubmissions.length;
  const totalFinishedSubmissions = completedCount + rejectedSubmissions.length;

  const hasEnoughData = completedCount > 0 || totalFinishedSubmissions > 0;

  // 1. Success Rate
  let successRatePercentage: number | null = null;
  let successRateFormatted = "N/A";
  if (totalFinishedSubmissions > 0) {
    successRatePercentage = Math.round((completedCount / totalFinishedSubmissions) * 100);
    successRateFormatted = `${successRatePercentage}%`;
  }

  // 2. Average Completion Time
  let avgCompletionTimeFormatted = "N/A";
  if (completedSubmissions.length > 0) {
    let totalMs = 0;
    for (const sub of completedSubmissions) {
      const duration =
        new Date(sub.createdAt).getTime() - new Date(sub.mission.createdAt).getTime();
      totalMs += Math.max(0, duration);
    }
    const avgMs = totalMs / completedSubmissions.length;
    const totalMinutes = Math.round(avgMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours > 0) {
      avgCompletionTimeFormatted = `${hours}h ${mins}m`;
    } else {
      avgCompletionTimeFormatted = `${mins}m`;
    }
  }

  // 3. On-Time Rate
  let onTimeRateFormatted = "N/A";
  let onTimePercentage = 100;
  if (completedSubmissions.length > 0) {
    const onTimeCount = completedSubmissions.filter(
      (s) => new Date(s.createdAt).getTime() <= new Date(s.mission.expiresAt).getTime(),
    ).length;
    onTimePercentage = Math.round((onTimeCount / completedSubmissions.length) * 100);
    onTimeRateFormatted = `${onTimePercentage}%`;
  }

  // 4. Total Earned
  let totalEarnedCents = 0;
  for (const sub of completedSubmissions) {
    totalEarnedCents += sub.mission.budgetCents || 0;
  }
  const totalEarnedUsd = Math.round(totalEarnedCents / 100);
  const totalEarnedFormatted = `$${totalEarnedUsd.toLocaleString("en-US")}`;

  // 5. Trust Score Computation
  let scoreNumeric: number | null = null;
  let scoreStars = "☆☆☆☆☆";
  let scoreLabel = "No history (New Member)";
  let ratingOutOfFive: number | null = null;

  if (hasEnoughData) {
    const succScore = (successRatePercentage ?? 50) * 0.7;
    const timeScore = onTimePercentage * 0.3;
    scoreNumeric = Math.min(100, Math.max(0, Math.round(succScore + timeScore)));

    ratingOutOfFive = Math.round((scoreNumeric / 20) * 10) / 10;

    if (scoreNumeric >= 90) scoreStars = "★★★★★";
    else if (scoreNumeric >= 70) scoreStars = "★★★★☆";
    else if (scoreNumeric >= 50) scoreStars = "★★★☆☆";
    else if (scoreNumeric >= 30) scoreStars = "★★☆☆☆";
    else scoreStars = "★☆☆☆☆";

    scoreLabel = `${scoreNumeric}/100`;
  }

  const p = user.userProfile as Record<string, any> | null;

  const currentYear = new Date().getFullYear();
  let ageRange = "ANY";
  if (p?.birthYear) {
    const age = currentYear - p.birthYear;
    if (age < 25) ageRange = "18–24";
    else if (age < 35) ageRange = "25–34";
    else if (age < 50) ageRange = "35–49";
    else ageRange = "50+";
  }

  const publicProfile = {
    bio: p?.bio || user.scoutProfile?.bio || "No bio added yet.",
    expertise:
      p?.expertise || user.scoutProfile?.categories.join(", ") || "Field Verification & Inspection",
    livingCity: p?.livingCity || "Ho Chi Minh City",
    livingCountry: p?.livingCountry || "Vietnam",
    livingCountryCode: p?.livingCountryCode || "VN",
    latitude: p?.latitude ?? 10.7769,
    longitude: p?.longitude ?? 106.7009,
    availableForMissions: p?.availableForMissions ?? true,
    missionCities:
      p?.missionCities && p.missionCities.length > 0 ? p.missionCities : ["Ho Chi Minh City"],
    skills:
      p?.skills && p.skills.length > 0
        ? p.skills
        : user.scoutProfile?.tags || ["On-Site Inspection", "Photo Audit"],
    preferredMissionTypes:
      p?.preferredMissionTypes && p.preferredMissionTypes.length > 0
        ? p.preferredMissionTypes
        : ["PHOTO_VERIFICATION", "STREET_CONDITIONS"],
    gender: p?.gender || "ANY",
    ageRange,
    languages: p?.languages && p.languages.length > 0 ? p.languages : ["English", "Vietnamese"],
    experienceLevel: p?.experienceLevel || "INTERMEDIATE",
    availabilityType: p?.availabilityType || "FLEXIBLE",
    education: p?.education || "University Graduate",
    certifications: p?.certifications || [],
    yearsOfExperience: p?.yearsOfExperience ?? 2,
  };

  const isSelfOrAdmin = requestingUserId === user.id || requestingUserRole === "ADMIN";

  const publicWorkHistory: PublicWorkHistoryItem[] = completedSubmissions
    .filter((s) => s.mission.visibility === "PUBLIC")
    .map((s) => {
      const usdAmount = Math.round((s.mission.budgetCents || 0) / 100);
      return {
        id: s.mission.id,
        title: s.mission.title,
        category: s.mission.category,
        completedDate: s.createdAt.toISOString(),
        rewardFormatted: `$${usdAmount}`,
        status: s.mission.status,
      };
    });

  const response: UserProfileResponse = {
    user: {
      id: user.id,
      displayName: user.displayName || user.email.split("@")[0] || "User",
      avatarUrl: user.avatarUrl,
      role: user.role,
      memberSince: user.createdAt.toISOString(),
      notificationSettings: {
        emailNotifyActivity: user.emailNotifyActivity ?? true,
        emailNotifyEvidence: user.emailNotifyEvidence ?? true,
        emailNotifyReward: user.emailNotifyReward ?? true,
        emailNotifyDispute: user.emailNotifyDispute ?? true,
        emailNotifySystem: user.emailNotifySystem ?? true,
      },
    },
    publicProfile,
    performance: {
      completedMissions: completedCount,
      successRateFormatted,
      successRatePercentage,
      avgCompletionTimeFormatted,
      totalEarnedFormatted,
      onTimeRateFormatted,
      hasEnoughData,
    },
    trust: {
      scoreNumeric,
      scoreStars,
      scoreLabel,
      ratingOutOfFive,
    },
    publicWorkHistory,
  };

  // Strictly attach private contact information ONLY for owner or admin
  if (isSelfOrAdmin) {
    response.privateContact = {
      legalName: p?.legalName || "",
      email: user.email,
      phone: p?.phone || "",
      privateNotes: p?.privateNotes || "",
    };
  }

  return response;
}

export async function updateUserProfile(
  userId: string,
  data: UserProfileUpdateInput & {
    notificationSettings?: {
      emailNotifyActivity?: boolean;
      emailNotifyEvidence?: boolean;
      emailNotifyReward?: boolean;
      emailNotifyDispute?: boolean;
      emailNotifySystem?: boolean;
    };
  },
): Promise<boolean> {
  // Update User table fields if present
  const userUpdates: Record<string, unknown> = {};
  if (data.displayName !== undefined) {
    userUpdates.displayName = data.displayName;
  }
  if (data.avatarUrl !== undefined) {
    userUpdates.avatarUrl = data.avatarUrl;
  }

  if (data.notificationSettings) {
    if (data.notificationSettings.emailNotifyActivity !== undefined)
      userUpdates.emailNotifyActivity = data.notificationSettings.emailNotifyActivity;
    if (data.notificationSettings.emailNotifyEvidence !== undefined)
      userUpdates.emailNotifyEvidence = data.notificationSettings.emailNotifyEvidence;
    if (data.notificationSettings.emailNotifyReward !== undefined)
      userUpdates.emailNotifyReward = data.notificationSettings.emailNotifyReward;
    if (data.notificationSettings.emailNotifyDispute !== undefined)
      userUpdates.emailNotifyDispute = data.notificationSettings.emailNotifyDispute;
    if (data.notificationSettings.emailNotifySystem !== undefined)
      userUpdates.emailNotifySystem = data.notificationSettings.emailNotifySystem;
  }

  if (Object.keys(userUpdates).length > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: userUpdates,
    });
  }

  // Upsert userProfile table record
  const profileData = {
    bio: data.bio,
    expertise: data.expertise,
    livingCity: data.livingCity,
    livingCountry: data.livingCountry,
    livingCountryCode: data.livingCountryCode,
    latitude: data.latitude,
    longitude: data.longitude,
    availableForMissions: data.availableForMissions,
    missionCities: data.missionCities,
    skills: data.skills,
    preferredMissionTypes: data.preferredMissionTypes,
    gender: data.gender,
    birthYear: data.birthYear,
    languages: data.languages,
    experienceLevel: data.experienceLevel,
    availabilityType: data.availabilityType,
    education: data.education,
    certifications: data.certifications,
    yearsOfExperience: data.yearsOfExperience,
    legalName: data.legalName,
    phone: data.phone,
    privateNotes: data.privateNotes,
  };

  // Remove undefined fields
  const cleanProfileData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(profileData)) {
    if (v !== undefined) {
      cleanProfileData[k] = v;
    }
  }

  await prisma.userProfile.upsert({
    where: { userId },
    create: {
      userId,
      ...cleanProfileData,
    },
    update: cleanProfileData,
  });

  return true;
}
