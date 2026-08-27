/* eslint-disable @typescript-eslint/no-explicit-any */
import { prisma } from "@/lib/prisma";
import { processSurveyReward } from "@/lib/survey-service";

export interface SurveyQuestionInput {
  order?: number;
  type: string;
  question: string;
  description?: string;
  required?: boolean;
  options?: any;
  validation?: any;
  condition?: any;
}

export async function checkSurveyLocked(missionId: string): Promise<boolean> {
  const count = await prisma.surveySubmission.count({
    where: { missionId, status: { in: ["SUBMITTED", "COMPLETED"] } },
  });
  return count > 0;
}

export async function createSurveyQuestion(missionId: string, input: SurveyQuestionInput) {
  const isLocked = await checkSurveyLocked(missionId);
  if (isLocked) {
    throw new Error("SURVEY_LOCKED: Cannot modify survey questions after submissions have started");
  }

  const existingCount = await prisma.surveyQuestion.count({ where: { missionId } });
  const question = await prisma.surveyQuestion.create({
    data: {
      missionId,
      order: input.order ?? existingCount + 1,
      type: input.type,
      question: input.question,
      description: input.description ?? null,
      required: input.required ?? true,
      options: input.options ?? null,
      validation: input.validation ?? null,
      condition: input.condition ?? null,
    },
  });

  return question;
}

export async function getSurveyQuestions(missionId: string) {
  return prisma.surveyQuestion.findMany({
    where: { missionId },
    orderBy: { order: "asc" },
  });
}

export async function updateSurveyQuestion(
  questionId: string,
  input: Partial<SurveyQuestionInput>,
) {
  const existing = await prisma.surveyQuestion.findUnique({ where: { id: questionId } });
  if (!existing) throw new Error("Question not found");

  const isLocked = await checkSurveyLocked(existing.missionId);
  if (isLocked) {
    throw new Error("SURVEY_LOCKED: Cannot modify survey questions after submissions have started");
  }

  return prisma.surveyQuestion.update({
    where: { id: questionId },
    data: {
      ...(input.order !== undefined ? { order: input.order } : {}),
      ...(input.type ? { type: input.type } : {}),
      ...(input.question ? { question: input.question } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.required !== undefined ? { required: input.required } : {}),
      ...(input.options !== undefined ? { options: input.options } : {}),
      ...(input.validation !== undefined ? { validation: input.validation } : {}),
      ...(input.condition !== undefined ? { condition: input.condition } : {}),
    },
  });
}

export async function deleteSurveyQuestion(questionId: string) {
  const existing = await prisma.surveyQuestion.findUnique({ where: { id: questionId } });
  if (!existing) throw new Error("Question not found");

  const isLocked = await checkSurveyLocked(existing.missionId);
  if (isLocked) {
    throw new Error("SURVEY_LOCKED: Cannot modify survey questions after submissions have started");
  }

  return prisma.surveyQuestion.delete({ where: { id: questionId } });
}

export function evaluateCondition(condition: any, answers: Record<string, any>): boolean {
  if (!condition || typeof condition !== "object") return true;

  const showIf = condition.showIf || condition;
  if (!showIf || !showIf.questionId) return true;

  const targetAnswer = answers[showIf.questionId];
  if (targetAnswer === undefined || targetAnswer === null) return false;

  const op = showIf.operator || "equals";
  const expected = showIf.value;

  switch (op) {
    case "equals":
    case "==":
      return String(targetAnswer).trim().toLowerCase() === String(expected).trim().toLowerCase();
    case "not_equals":
    case "!=":
      return String(targetAnswer).trim().toLowerCase() !== String(expected).trim().toLowerCase();
    case "contains":
      if (Array.isArray(targetAnswer)) {
        return targetAnswer.some((val) =>
          String(val).toLowerCase().includes(String(expected).toLowerCase()),
        );
      }
      return String(targetAnswer).toLowerCase().includes(String(expected).toLowerCase());
    case "in":
      if (Array.isArray(expected)) {
        return expected.includes(targetAnswer);
      }
      return false;
    default:
      return true;
  }
}

export function validateAnswer(question: any, value: any): { valid: boolean; error?: string } {
  if (question.required && (value === undefined || value === null || value === "")) {
    return { valid: false, error: `Question "${question.question}" is required` };
  }

  if (value === undefined || value === null || value === "") {
    return { valid: true };
  }

  const valRule = question.validation || {};

  switch (question.type) {
    case "NUMBER": {
      const num = Number(value);
      if (isNaN(num)) return { valid: false, error: "Must be a valid number" };
      if (valRule.min !== undefined && num < valRule.min)
        return { valid: false, error: `Value must be >= ${valRule.min}` };
      if (valRule.max !== undefined && num > valRule.max)
        return { valid: false, error: `Value must be <= ${valRule.max}` };
      break;
    }
    case "RATING": {
      const rating = Number(value);
      if (isNaN(rating)) return { valid: false, error: "Must be a valid rating" };
      const min = valRule.min ?? 1;
      const max = valRule.max ?? 5;
      if (rating < min || rating > max)
        return { valid: false, error: `Rating must be between ${min} and ${max}` };
      break;
    }
    case "TEXT": {
      const str = String(value);
      if (valRule.minLength && str.length < valRule.minLength)
        return { valid: false, error: `Text length must be >= ${valRule.minLength}` };
      if (valRule.maxLength && str.length > valRule.maxLength)
        return { valid: false, error: `Text length must be <= ${valRule.maxLength}` };
      break;
    }
    case "MULTIPLE_CHOICE": {
      const arr = Array.isArray(value) ? value : [value];
      if (valRule.minSelections && arr.length < valRule.minSelections)
        return { valid: false, error: `Select at least ${valRule.minSelections} options` };
      if (valRule.maxSelections && arr.length > valRule.maxSelections)
        return { valid: false, error: `Select at most ${valRule.maxSelections} options` };
      break;
    }
  }

  return { valid: true };
}

export async function submitSurveyAnswers(params: {
  missionId: string;
  workerUserId: string;
  answers: Record<string, any>;
  durationSeconds?: number;
  completionCode?: string;
}) {
  const { missionId, workerUserId, answers, durationSeconds = 0, completionCode } = params;

  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: {
      id: true,
      title: true,
      category: true,
      status: true,
      expiresAt: true,
      selectionMode: true,
      disputeMode: true,
      rewardPerValidSubmissionCents: true,
    },
  });

  if (!mission || mission.category !== "SURVEY") {
    throw new Error("Mission not found or is not a SURVEY mission");
  }

  const now = new Date();
  if (now > mission.expiresAt) {
    throw new Error("Mission has expired");
  }

  const participant = await prisma.surveyParticipant.findUnique({
    where: { missionId_userId: { missionId, userId: workerUserId } },
  });

  if (!participant) {
    throw new Error("Participant not registered or screened for this survey");
  }

  if (participant.screeningStatus === "SCREENED_OUT") {
    throw new Error("Worker is screened out from this survey");
  }

  // Load Survey Questions
  const questions = await prisma.surveyQuestion.findMany({
    where: { missionId },
    orderBy: { order: "asc" },
  });

  // Evaluate Active Questions based on conditions
  const activeQuestions = questions.filter((q) => evaluateCondition(q.condition, answers));

  // Validate Active Questions
  for (const q of activeQuestions) {
    const valRes = validateAnswer(q, answers[q.id]);
    if (!valRes.valid) {
      throw new Error(`Validation Error on "${q.question}": ${valRes.error}`);
    }
  }

  // Quality Validation Pipeline
  let qualityScore = 100;
  let qualityStatus = "PASSED";

  for (const q of activeQuestions) {
    const valRule = (q.validation as Record<string, any> | null) || {};
    if (valRule.qualityCheck && valRule.expectedAnswer !== undefined) {
      const userAnswer = answers[q.id];
      if (
        String(userAnswer).trim().toLowerCase() !==
        String(valRule.expectedAnswer).trim().toLowerCase()
      ) {
        qualityStatus = "FAILED";
        qualityScore = 0;
      }
    }
  }

  if (qualityStatus !== "FAILED") {
    if (durationSeconds < 10) {
      qualityStatus = "SUSPICIOUS";
      qualityScore = 50;
    }
  }

  const submission = await prisma.$transaction(async (tx) => {
    // Save/Update Survey Responses for Active Questions
    for (const q of activeQuestions) {
      const val = answers[q.id];
      if (val !== undefined && val !== null) {
        await tx.surveyResponse.upsert({
          where: {
            missionId_participantId_questionId: {
              missionId,
              participantId: participant.id,
              questionId: q.id,
            },
          },
          create: {
            missionId,
            participantId: participant.id,
            questionId: q.id,
            value: val as any,
          },
          update: {
            value: val as any,
          },
        });
      }
    }

    const sub = await tx.surveySubmission.upsert({
      where: { missionId_participantId: { missionId, participantId: participant.id } },
      create: {
        missionId,
        participantId: participant.id,
        status: qualityStatus === "FAILED" ? "REJECTED" : "COMPLETED",
        completionCode: completionCode ?? null,
        submittedAt: now,
        completedAt: now,
        durationSeconds,
        qualityScore,
        qualityStatus,
      },
      update: {
        status: qualityStatus === "FAILED" ? "REJECTED" : "COMPLETED",
        completionCode: completionCode ?? null,
        submittedAt: now,
        completedAt: now,
        durationSeconds,
        qualityScore,
        qualityStatus,
      },
    });

    return sub;
  });

  // Trigger P1/P2 Selection and Reward Pipeline if quality PASSED
  let selectionResult = null;
  if (qualityStatus === "PASSED") {
    if (mission.selectionMode === "AUTO") {
      selectionResult = await processSurveyReward({
        missionId,
        workerUserId,
        evidenceId: "survey-response",
        rewardCents: mission.rewardPerValidSubmissionCents || 1000,
      });
    } else {
      await prisma.surveyParticipant.update({
        where: { id: participant.id },
        data: { status: "UNDER_REVIEW" },
      });
      selectionResult = {
        status: "UNDER_REVIEW",
        message: "Survey completed and sent for requester review.",
      };
    }
  }

  return {
    success: true,
    qualityStatus,
    qualityScore,
    submission,
    selectionResult,
  };
}

export async function exportSurveyData(missionId: string, format: "csv" | "json" = "csv") {
  const questions = await prisma.surveyQuestion.findMany({
    where: { missionId },
    orderBy: { order: "asc" },
  });

  const participants = await prisma.surveyParticipant.findMany({
    where: { missionId },
    include: {
      user: { select: { email: true, displayName: true } },
      responses: true,
      submissions: true,
    },
  });

  const rows = participants.map((p) => {
    const snap = (p.profileSnapshot as Record<string, any> | null) || {};
    const sub = (p.submissions[0] as Record<string, any> | undefined) || {};
    const respMap = new Map(p.responses.map((r) => [r.questionId, r.value]));

    const row: Record<string, any> = {
      participantId: p.id,
      userId: p.userId,
      country: snap.country || "",
      ageRange: snap.ageRange || "",
      gender: snap.gender || "",
      status: p.status,
      qualityStatus: sub.qualityStatus || "PENDING",
      qualityScore: sub.qualityScore ?? "",
      durationSeconds: sub.durationSeconds ?? "",
      submittedAt: sub.submittedAt ? new Date(sub.submittedAt).toISOString() : "",
    };

    questions.forEach((q) => {
      const val = respMap.get(q.id);
      row[`Q_${q.order}_${q.question.substring(0, 20)}`] =
        val !== undefined ? JSON.stringify(val) : "";
    });

    return row;
  });

  if (format === "json") return rows;

  // Generate CSV
  if (rows.length === 0 || !rows[0]) return "participantId,status\n";

  const headers = Object.keys(rows[0] as object);
  const csvLines = [
    headers.join(","),
    ...rows.map((r) =>
      headers
        .map((h) => {
          const cell = String(r[h] ?? "").replace(/"/g, '""');
          return `"${cell}"`;
        })
        .join(","),
    ),
  ];

  return csvLines.join("\n");
}

export async function getSurveyAnalytics(missionId: string) {
  const mission = await prisma.mission.findUnique({
    where: { id: missionId },
    select: {
      maxParticipants: true,
      rewardBudgetCents: true,
      remainingBudgetCents: true,
      rewardPerValidSubmissionCents: true,
      quotas: true,
    },
  });

  if (!mission) return null;

  const participants = await prisma.surveyParticipant.findMany({
    where: { missionId },
    include: { submissions: true, responses: true },
  });

  const questions = await prisma.surveyQuestion.findMany({
    where: { missionId },
    orderBy: { order: "asc" },
  });

  let selected = 0;
  let completed = 0;
  let rejected = 0;
  let suspicious = 0;
  let totalDuration = 0;
  let totalQualityScore = 0;
  let scoredSubmissions = 0;

  const countryCounts: Record<string, number> = {};
  const ageCounts: Record<string, number> = {};
  const genderCounts: Record<string, number> = {};

  participants.forEach((p) => {
    if (p.status === "SELECTED" || p.status === "REWARDED") selected++;

    const snap = (p.profileSnapshot as Record<string, any> | null) || {};
    if (snap.country) countryCounts[snap.country] = (countryCounts[snap.country] || 0) + 1;
    if (snap.ageRange) ageCounts[snap.ageRange] = (ageCounts[snap.ageRange] || 0) + 1;
    if (snap.gender) genderCounts[snap.gender] = (genderCounts[snap.gender] || 0) + 1;

    const sub = p.submissions[0];
    if (sub) {
      if (sub.status === "COMPLETED") completed++;
      if (sub.qualityStatus === "FAILED") rejected++;
      if (sub.qualityStatus === "SUSPICIOUS") suspicious++;
      if (sub.durationSeconds) totalDuration += sub.durationSeconds;
      if (sub.qualityScore !== null && sub.qualityScore !== undefined) {
        totalQualityScore += sub.qualityScore;
        scoredSubmissions++;
      }
    }
  });

  const totalParticipants = participants.length;
  const completionRate = totalParticipants > 0 ? (completed / totalParticipants) * 100 : 0;
  const rejectionRate = totalParticipants > 0 ? (rejected / totalParticipants) * 100 : 0;
  const averageDuration = completed > 0 ? totalDuration / completed : 0;
  const averageQualityScore = scoredSubmissions > 0 ? totalQualityScore / scoredSubmissions : 100;

  const totalBudgetUSD = Math.round((mission.rewardBudgetCents || 0) / 100);
  const remainingBudgetUSD = Math.round((mission.remainingBudgetCents || 0) / 100);
  const rewardSpentUSD = totalBudgetUSD - remainingBudgetUSD;
  const costPerCompletedParticipant = completed > 0 ? rewardSpentUSD / completed : 0;

  // Question Analytics
  const questionAnalytics = questions.map((q) => {
    const qResponses = participants.flatMap((p) =>
      p.responses.filter((r) => r.questionId === q.id).map((r) => r.value),
    );

    const distribution: Record<string, number> = {};
    let averageRating: number | null = null;

    if (q.type === "RATING" || q.type === "NUMBER") {
      const nums = qResponses.map((v) => Number(v)).filter((v) => !isNaN(v));
      if (nums.length > 0) {
        const sum = nums.reduce((a, b) => a + b, 0);
        averageRating = sum / nums.length;
      }
    }

    qResponses.forEach((val) => {
      const key = typeof val === "object" ? JSON.stringify(val) : String(val);
      distribution[key] = (distribution[key] || 0) + 1;
    });

    return {
      questionId: q.id,
      question: q.question,
      type: q.type,
      totalResponses: qResponses.length,
      distribution,
      averageRating,
    };
  });

  return {
    overview: {
      totalParticipants,
      selected,
      completed,
      rejected,
      suspicious,
      completionRate: Math.round(completionRate * 10) / 10,
      rejectionRate: Math.round(rejectionRate * 10) / 10,
      averageDuration: Math.round(averageDuration),
      averageQualityScore: Math.round(averageQualityScore),
      rewardSpentUSD,
      remainingBudgetUSD,
      costPerCompletedParticipant: Math.round(costPerCompletedParticipant * 100) / 100,
    },
    demographics: {
      country: countryCounts,
      ageRange: ageCounts,
      gender: genderCounts,
    },
    questionAnalytics,
  };
}
