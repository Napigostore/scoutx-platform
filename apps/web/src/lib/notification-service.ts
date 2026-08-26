import { prisma } from "@/lib/prisma";

type NotificationType =
  | "MISSION_ASSIGNED"
  | "EVIDENCE_UPLOADED"
  | "REWARD_REQUEST"
  | "APPROVED"
  | "REJECTED"
  | "COMPLETED"
  | "DISPUTE"
  | "VOTING"
  | "SETTLEMENT"
  | "REWARD_PAID";

export async function createNotification(args: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  missionId?: string;
}) {
  try {
    await prisma.notification.create({
      data: {
        userId: args.userId,
        type: args.type,
        title: args.title,
        body: args.body,
        link: args.link ?? null,
        missionId: args.missionId ?? null,
      },
    });
  } catch {
    // Never crash main flow
  }
}

export async function notifyEvidenceUploaded(missionId: string, uploaderId: string) {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: { title: true, requesterId: true },
  });
  if (!mission) return;
  if (mission.requesterId === uploaderId) return;
  await createNotification({
    userId: mission.requesterId,
    type: "EVIDENCE_UPLOADED",
    title: "New Evidence Uploaded",
    body: `A participant uploaded new evidence for mission "${mission.title}".`,
    link: `/missions/${missionId}`,
    missionId,
  });
}

export async function notifyRewardRequest(missionId: string, requesterId: string) {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: { title: true },
  });
  if (!mission) return;
  await createNotification({
    userId: requesterId,
    type: "REWARD_REQUEST",
    title: "Reward Request Received",
    body: `A participant is requesting the reward for "${mission.title}".`,
    link: `/missions/${missionId}`,
    missionId,
  });
}

export async function notifyApproved(missionId: string, workerId: string) {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: { title: true },
  });
  if (!mission) return;
  await createNotification({
    userId: workerId,
    type: "APPROVED",
    title: "Mission Completion Approved",
    body: `Your work on "${mission.title}" has been approved.`,
    link: `/missions/${missionId}`,
    missionId,
  });
}

export async function notifyRejected(missionId: string, workerId: string) {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: { title: true },
  });
  if (!mission) return;
  await createNotification({
    userId: workerId,
    type: "REJECTED",
    title: "Reward Request Rejected",
    body: `Your reward request for "${mission.title}" was rejected.`,
    link: `/missions/${missionId}`,
    missionId,
  });
}

export async function notifyMissionAssigned(missionId: string, scoutUserId: string) {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: { title: true },
  });
  if (!mission) return;
  await createNotification({
    userId: scoutUserId,
    type: "MISSION_ASSIGNED",
    title: "You've Been Assigned a Mission",
    body: `You have been assigned to "${mission.title}".`,
    link: `/missions/${missionId}`,
    missionId,
  });
}

export async function notifyRewardPaid(missionId: string, workerId: string) {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: { title: true },
  });
  if (!mission) return;
  await createNotification({
    userId: workerId,
    type: "REWARD_PAID",
    title: "Reward Released!",
    body: `Your reward for "${mission.title}" has been released.`,
    link: `/missions/${missionId}`,
    missionId,
  });
}
