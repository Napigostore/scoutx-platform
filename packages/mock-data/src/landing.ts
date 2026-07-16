import type { Mission, MissionCategory } from "@scoutx/types";

import { mockLocations } from "./locations.js";
import { mockMissions } from "./missions.js";

export interface TrendingMissionCard {
  id: string;
  title: string;
  category: MissionCategory;
  city: string;
  country: string;
  urgency: Mission["urgency"];
  budgetLabel: string;
  status: Mission["status"];
}

function formatBudget(amountCents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

export function getTrendingMissions(limit = 6): TrendingMissionCard[] {
  const locationById = new Map(mockLocations.map((location) => [location.id, location]));

  return mockMissions
    .filter((mission) => mission.status === "OPEN")
    .slice(0, limit)
    .map((mission) => {
      const location = locationById.get(mission.locationId);
      if (!location) {
        throw new Error(`Missing location for mission ${mission.id}`);
      }

      return {
        id: mission.id,
        title: mission.title,
        category: mission.category,
        city: location.city,
        country: location.country,
        urgency: mission.urgency,
        budgetLabel: formatBudget(mission.budget.amountCents, mission.budget.currency),
        status: mission.status,
      };
    });
}

export interface HowItWorksStep {
  step: number;
  title: string;
  description: string;
}

export const howItWorksSteps: HowItWorksStep[] = [
  {
    step: 1,
    title: "Compose a mission",
    description:
      "Describe the real-world question, pin a location, set urgency, and attach a budget for verified answers.",
  },
  {
    step: 2,
    title: "Match nearby scouts",
    description:
      "ScoutX ranks available scouts by proximity, reliability, category fit, and tag overlap.",
  },
  {
    step: 3,
    title: "Receive grounded evidence",
    description:
      "Scouts submit observations with timestamps, coordinates, and media so you can act with confidence.",
  },
];
