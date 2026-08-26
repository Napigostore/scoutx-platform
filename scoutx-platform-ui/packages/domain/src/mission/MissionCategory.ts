export enum MissionCategory {
  PERSON = "PERSON",
  PLACE = "PLACE",
  OBJECT = "OBJECT",
  DOCUMENT = "DOCUMENT",
  EVENT = "EVENT",
  PHOTO = "PHOTO",
  VIDEO = "VIDEO",
  LIVE_STREAM = "LIVE_STREAM",
  FACTORY = "FACTORY",
  TRANSLATOR = "TRANSLATOR",
  MUSIC = "MUSIC",
  GENEALOGY = "GENEALOGY",
  FACT_CHECK = "FACT_CHECK",
  OTHER = "OTHER",
}

export const MISSION_CATEGORIES: readonly MissionCategory[] = Object.freeze(
  Object.values(MissionCategory),
);

export function isMissionCategory(value: string): value is MissionCategory {
  return (MISSION_CATEGORIES as readonly string[]).includes(value);
}
