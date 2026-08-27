/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";

// Profile completion fields and weights
const PROFILE_FIELDS: Array<{ field: string; weight: number; required: boolean }> = [
  { field: "country", weight: 15, required: true },
  { field: "languages", weight: 10, required: true },
  { field: "employmentStatus", weight: 8, required: false },
  { field: "industry", weight: 8, required: false },
  { field: "jobTitle", weight: 7, required: false },
  { field: "education", weight: 7, required: false },
  { field: "region", weight: 5, required: false },
  { field: "city", weight: 5, required: false },
  { field: "deviceType", weight: 5, required: false },
  { field: "skills", weight: 10, required: false },
  { field: "interests", weight: 10, required: false },
  { field: "productUsage", weight: 5, required: false },
  { field: "purchaseBehavior", weight: 5, required: false },
];

export function computeProfileCompletedPercent(profile: Record<string, any>): number {
  let totalWeight = 0;
  let earned = 0;
  for (const { field, weight } of PROFILE_FIELDS) {
    totalWeight += weight;
    const val = profile[field];
    if (
      val !== null &&
      val !== undefined &&
      val !== "" &&
      !(Array.isArray(val) && val.length === 0)
    ) {
      earned += weight;
    }
  }
  return Math.round((earned / totalWeight) * 100);
}

export async function upsertAudienceProfile(
  userId: string,
  data: {
    country?: string;
    region?: string | null;
    city?: string | null;
    languages?: string[];
    employmentStatus?: string | null;
    industry?: string | null;
    jobTitle?: string | null;
    education?: string | null;
    incomeRange?: string | null;
    deviceType?: string | null;
    os?: string | null;
    skills?: string[];
    interests?: string[];
    productUsage?: string[];
    purchaseBehavior?: string[];
    consentVersion?: string | null;
    consentAt?: Date | null;
  },
) {
  if (!data.country) {
    throw new Error("country is required for audience profile");
  }

  // Read existing profile to merge data
  const existing = await prisma.audienceProfile.findUnique({ where: { userId } });

  const merged = {
    ...existing,
    ...data,
    userId,
  };

  const completedPercent = computeProfileCompletedPercent(merged);

  return prisma.audienceProfile.upsert({
    where: { userId },
    create: {
      userId,
      country: data.country,
      region: data.region ?? null,
      city: data.city ?? null,
      languages: (data.languages as any) ?? null,
      employmentStatus: data.employmentStatus ?? null,
      industry: data.industry ?? null,
      jobTitle: data.jobTitle ?? null,
      education: data.education ?? null,
      incomeRange: data.incomeRange ?? null,
      deviceType: data.deviceType ?? null,
      os: data.os ?? null,
      skills: (data.skills as any) ?? null,
      interests: (data.interests as any) ?? null,
      productUsage: (data.productUsage as any) ?? null,
      purchaseBehavior: (data.purchaseBehavior as any) ?? null,
      consentVersion: data.consentVersion ?? null,
      consentAt: data.consentAt ?? null,
      profileCompletedPercent: completedPercent,
    },
    update: {
      ...(data.country !== undefined ? { country: data.country } : {}),
      ...(data.region !== undefined ? { region: data.region } : {}),
      ...(data.city !== undefined ? { city: data.city } : {}),
      ...(data.languages !== undefined ? { languages: data.languages as any } : {}),
      ...(data.employmentStatus !== undefined ? { employmentStatus: data.employmentStatus } : {}),
      ...(data.industry !== undefined ? { industry: data.industry } : {}),
      ...(data.jobTitle !== undefined ? { jobTitle: data.jobTitle } : {}),
      ...(data.education !== undefined ? { education: data.education } : {}),
      ...(data.incomeRange !== undefined ? { incomeRange: data.incomeRange } : {}),
      ...(data.deviceType !== undefined ? { deviceType: data.deviceType } : {}),
      ...(data.os !== undefined ? { os: data.os } : {}),
      ...(data.skills !== undefined ? { skills: data.skills as any } : {}),
      ...(data.interests !== undefined ? { interests: data.interests as any } : {}),
      ...(data.productUsage !== undefined ? { productUsage: data.productUsage as any } : {}),
      ...(data.purchaseBehavior !== undefined
        ? { purchaseBehavior: data.purchaseBehavior as any }
        : {}),
      ...(data.consentVersion !== undefined ? { consentVersion: data.consentVersion } : {}),
      ...(data.consentAt !== undefined ? { consentAt: data.consentAt } : {}),
      profileCompletedPercent: completedPercent,
    },
  });
}

export async function getAudienceProfile(userId: string) {
  return prisma.audienceProfile.findUnique({ where: { userId } });
}

// Criteria matching logic — server-side only
export type AudienceCriteria = {
  countries?: string[];
  regions?: string[];
  cities?: string[];
  employmentStatuses?: string[];
  industries?: string[];
  jobTitles?: string[];
  educations?: string[];
  languages?: string[];
  skills?: string[];
  interests?: string[];
  minimumTrustScore?: number;
  minimumQualityScore?: number;
  minimumCompletedMissions?: number;
  verifiedOnly?: boolean;
  productUsage?: string[];
  purchaseBehavior?: string[];
};

export async function estimateAudienceSize(criteria: AudienceCriteria): Promise<number> {
  const where = buildProfileWhere(criteria);
  return prisma.audienceProfile.count({ where });
}

function buildProfileWhere(criteria: AudienceCriteria) {
  const where: Record<string, any> = {};

  if (criteria.countries && criteria.countries.length > 0) {
    where.country = { in: criteria.countries };
  }
  if (criteria.regions && criteria.regions.length > 0) {
    where.region = { in: criteria.regions };
  }
  if (criteria.cities && criteria.cities.length > 0) {
    where.city = { in: criteria.cities };
  }
  if (criteria.employmentStatuses && criteria.employmentStatuses.length > 0) {
    where.employmentStatus = { in: criteria.employmentStatuses };
  }
  if (criteria.industries && criteria.industries.length > 0) {
    where.industry = { in: criteria.industries };
  }
  if (criteria.jobTitles && criteria.jobTitles.length > 0) {
    where.jobTitle = { in: criteria.jobTitles };
  }
  if (criteria.educations && criteria.educations.length > 0) {
    where.education = { in: criteria.educations };
  }

  return where;
}

export async function saveSavedAudience(
  requesterId: string,
  data: { name: string; description?: string; criteria: AudienceCriteria },
) {
  const estimated = await estimateAudienceSize(data.criteria);
  return prisma.savedAudience.create({
    data: {
      requesterId,
      name: data.name,
      description: data.description ?? null,
      criteria: data.criteria as any,
      estimatedEligibleCount: estimated,
    },
  });
}

export async function getSavedAudiences(requesterId: string) {
  return prisma.savedAudience.findMany({
    where: { requesterId },
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteSavedAudience(audienceId: string, requesterId: string) {
  const aud = await prisma.savedAudience.findUnique({ where: { id: audienceId } });
  if (!aud || aud.requesterId !== requesterId) throw new Error("Not found or forbidden");
  return prisma.savedAudience.delete({ where: { id: audienceId } });
}

export async function recordResearchParticipantHistory(params: {
  workerId: string;
  missionId: string;
  requesterId: string;
  status?: string;
  completedAt?: Date;
  qualityScore?: number;
  rewardAmount?: number;
}) {
  return prisma.researchParticipantHistory.upsert({
    where: { workerId_missionId: { workerId: params.workerId, missionId: params.missionId } },
    create: {
      workerId: params.workerId,
      missionId: params.missionId,
      requesterId: params.requesterId,
      status: params.status ?? "COMPLETED",
      completedAt: params.completedAt ?? new Date(),
      qualityScore: params.qualityScore ?? null,
      rewardAmount: params.rewardAmount ?? null,
    },
    update: {
      status: params.status ?? "COMPLETED",
      completedAt: params.completedAt ?? new Date(),
      qualityScore: params.qualityScore ?? null,
      rewardAmount: params.rewardAmount ?? null,
    },
  });
}

export async function getWorkerParticipationHistory(workerId: string) {
  return prisma.researchParticipantHistory.findMany({
    where: { workerId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

export async function getPanelStats(requesterId: string) {
  const audiences = await prisma.savedAudience.findMany({
    where: { requesterId },
    include: {
      _count: { select: { members: true } },
    },
  });

  const totalCompleted = await prisma.researchParticipantHistory.count({
    where: { requesterId, status: "COMPLETED" },
  });

  return {
    audienceCount: audiences.length,
    totalPanelMembers: audiences.reduce((sum, a) => sum + a._count.members, 0),
    totalCompletedResearch: totalCompleted,
    audiences: audiences.map((a) => ({
      id: a.id,
      name: a.name,
      description: a.description,
      estimatedEligibleCount: a.estimatedEligibleCount,
      memberCount: a._count.members,
      createdAt: a.createdAt,
    })),
  };
}
