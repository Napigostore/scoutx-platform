export enum MissionStatus {
  DRAFT = "DRAFT",
  PUBLISHED = "PUBLISHED",
  ACCEPTED = "ACCEPTED",
  IN_PROGRESS = "IN_PROGRESS",
  SUBMITTED = "SUBMITTED",
  VERIFYING = "VERIFYING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export const MISSION_STATUSES: readonly MissionStatus[] = Object.freeze(
  Object.values(MissionStatus),
);

export function isMissionStatus(value: string): value is MissionStatus {
  return (MISSION_STATUSES as readonly string[]).includes(value);
}

const MISSION_STATUS_TRANSITIONS: Readonly<Record<MissionStatus, readonly MissionStatus[]>> =
  Object.freeze({
    [MissionStatus.DRAFT]: Object.freeze([MissionStatus.PUBLISHED, MissionStatus.CANCELLED]),
    [MissionStatus.PUBLISHED]: Object.freeze([MissionStatus.ACCEPTED, MissionStatus.CANCELLED]),
    [MissionStatus.ACCEPTED]: Object.freeze([
      MissionStatus.IN_PROGRESS,
      MissionStatus.CANCELLED,
      MissionStatus.FAILED,
    ]),
    [MissionStatus.IN_PROGRESS]: Object.freeze([
      MissionStatus.SUBMITTED,
      MissionStatus.CANCELLED,
      MissionStatus.FAILED,
    ]),
    [MissionStatus.SUBMITTED]: Object.freeze([
      MissionStatus.VERIFYING,
      MissionStatus.FAILED,
      MissionStatus.CANCELLED,
    ]),
    [MissionStatus.VERIFYING]: Object.freeze([
      MissionStatus.COMPLETED,
      MissionStatus.FAILED,
      MissionStatus.IN_PROGRESS,
    ]),
    [MissionStatus.COMPLETED]: Object.freeze([]),
    [MissionStatus.FAILED]: Object.freeze([]),
    [MissionStatus.CANCELLED]: Object.freeze([]),
  });

export function canTransitionMissionStatus(from: MissionStatus, to: MissionStatus): boolean {
  return MISSION_STATUS_TRANSITIONS[from].includes(to);
}

export function assertMissionStatusTransition(from: MissionStatus, to: MissionStatus): void {
  if (!canTransitionMissionStatus(from, to)) {
    throw new Error(`Invalid mission status transition: ${from} -> ${to}`);
  }
}

export function isTerminalMissionStatus(status: MissionStatus): boolean {
  return (
    status === MissionStatus.COMPLETED ||
    status === MissionStatus.FAILED ||
    status === MissionStatus.CANCELLED
  );
}
