export enum MissionDifficulty {
  EASY = "EASY",
  STANDARD = "STANDARD",
  HARD = "HARD",
  EXPERT = "EXPERT",
}

export const MISSION_DIFFICULTIES: readonly MissionDifficulty[] = Object.freeze(
  Object.values(MissionDifficulty),
);

export function isMissionDifficulty(value: string): value is MissionDifficulty {
  return (MISSION_DIFFICULTIES as readonly string[]).includes(value);
}

export function missionDifficultyRank(difficulty: MissionDifficulty): number {
  switch (difficulty) {
    case MissionDifficulty.EASY:
      return 1;
    case MissionDifficulty.STANDARD:
      return 2;
    case MissionDifficulty.HARD:
      return 3;
    case MissionDifficulty.EXPERT:
      return 4;
    default: {
      const _exhaustive: never = difficulty;
      return _exhaustive;
    }
  }
}
