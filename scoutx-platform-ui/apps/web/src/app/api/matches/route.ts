import { NextResponse } from "next/server";

import { rankScoutsForMission } from "@scoutx/matching";
import { mockMissions, mockScouts } from "@scoutx/mock-data";

export async function GET() {
  const mission = mockMissions[0];
  if (!mission) {
    return NextResponse.json({ matches: [] });
  }

  const matches = rankScoutsForMission({
    mission,
    scouts: mockScouts,
    limit: 5,
    now: new Date("2026-07-16T10:00:00.000Z"),
  });

  return NextResponse.json({
    missionId: mission.id,
    matches,
  });
}
