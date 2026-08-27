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
    const user = await prisma.user.findUnique({
      where: { id: args.userId },
      select: {
        email: true,
        emailNotifyActivity: true,
        emailNotifyEvidence: true,
        emailNotifyReward: true,
        emailNotifyDispute: true,
        emailNotifySystem: true,
      },
    });

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

    // Check email settings
    if (user) {
      let shouldSend = true;
      if (args.type === "EVIDENCE_UPLOADED" && !user.emailNotifyEvidence) shouldSend = false;
      if (
        (args.type === "REWARD_REQUEST" || args.type === "REWARD_PAID") &&
        !user.emailNotifyReward
      )
        shouldSend = false;
      if (
        (args.type === "DISPUTE" || args.type === "VOTING" || args.type === "SETTLEMENT") &&
        !user.emailNotifyDispute
      )
        shouldSend = false;
      if (
        (args.type === "MISSION_ASSIGNED" ||
          args.type === "APPROVED" ||
          args.type === "REJECTED" ||
          args.type === "COMPLETED") &&
        !user.emailNotifyActivity
      )
        shouldSend = false;

      if (shouldSend) {
        console.log(`[EMAIL_SERVICE] Sending email to ${user.email}: ${args.title}`);
        // In a real app, integrate resend/sendgrid here
      } else {
        console.log(`[EMAIL_SERVICE] Skipped email to ${user.email} due to notification settings`);
      }
    }
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

export async function notifyMissionJoined(missionId: string, workerUserId: string) {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: { title: true, requesterId: true },
  });
  if (!mission) return;

  // 1. Notify worker
  await createNotification({
    userId: workerUserId,
    type: "MISSION_ASSIGNED",
    title: "Đã tham gia nhiệm vụ",
    body: `Bạn đã tham gia nhiệm vụ "${mission.title}".`,
    link: `/missions/${missionId}`,
    missionId,
  });

  // 2. Notify requester
  if (mission.requesterId !== workerUserId) {
    await createNotification({
      userId: mission.requesterId,
      type: "MISSION_ASSIGNED",
      title: "Có người tham gia nhiệm vụ",
      body: `Một người dùng đã tham gia nhiệm vụ "${mission.title}".`,
      link: `/missions/${missionId}`,
      missionId,
    });
  }
}

export async function notifyNonWinners(missionId: string, winnerId: string) {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: {
      title: true,
      requesterId: true,
      recipients: { select: { userId: true } },
      evidence: { select: { userId: true } },
      submission: { select: { userId: true } },
      timelineEntries: { select: { actorId: true } },
    },
  });
  if (!mission) return;

  const participantUserIds = new Set<string>();
  mission.recipients.forEach((r) => participantUserIds.add(r.userId));
  mission.evidence.forEach((e) => participantUserIds.add(e.userId));
  if (mission.submission?.userId) participantUserIds.add(mission.submission.userId);
  mission.timelineEntries.forEach((t) => {
    if (t.actorId) participantUserIds.add(t.actorId);
  });

  participantUserIds.delete(winnerId);
  participantUserIds.delete(mission.requesterId);

  for (const userId of participantUserIds) {
    await createNotification({
      userId,
      type: "COMPLETED",
      title: "Kết quả nhiệm vụ đã được chọn",
      body: `Requester đã chọn người nhận thưởng cho nhiệm vụ "${mission.title}". Bạn có 24h để xem kết quả hoặc gửi khiếu nại (Claim/Dispute).`,
      link: `/missions/${missionId}`,
      missionId,
    });
  }
}

export async function notifyDisputeCreated(missionId: string, initiatorId: string) {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: {
      title: true,
      requesterId: true,
      recipients: { select: { userId: true } },
      evidence: { select: { userId: true } },
      submission: { select: { userId: true } },
    },
  });
  if (!mission) return;

  const userIdsToNotify = new Set<string>();
  userIdsToNotify.add(mission.requesterId);
  mission.recipients.forEach((r) => userIdsToNotify.add(r.userId));
  mission.evidence.forEach((e) => userIdsToNotify.add(e.userId));
  if (mission.submission?.userId) userIdsToNotify.add(mission.submission.userId);

  userIdsToNotify.delete(initiatorId);

  for (const userId of userIdsToNotify) {
    await createNotification({
      userId,
      type: "DISPUTE",
      title: "Tranh chấp nhiệm vụ mới",
      body: `Một tranh chấp mới đã được mở cho nhiệm vụ "${mission.title}".`,
      link: `/missions/${missionId}`,
      missionId,
    });
  }
}
