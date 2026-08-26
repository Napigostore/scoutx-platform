import type { Mission } from "@scoutx/types";

import { mockLocations } from "./locations.js";
import { mockUsers } from "./users.js";

const now = new Date("2026-07-16T10:00:00.000Z");
const inSixHours = new Date(now.getTime() + 6 * 60 * 60 * 1000);
const inTwelveHours = new Date(now.getTime() + 12 * 60 * 60 * 1000);
const inOneDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);

const tokyo = mockLocations[0]!;
const newYork = mockLocations[1]!;
const london = mockLocations[2]!;
const singapore = mockLocations[3]!;
const barcelona = mockLocations[4]!;
const hcmc = mockLocations[5]!;

export const mockMissions: Mission[] = [
  {
    id: "44444444-4444-4444-8444-444444444401",
    title: "Shibuya Crossing queue density before rush hour",
    description:
      "Need a live count of pedestrian density on the main scramble crossing, plus a note on police barriers and any temporary closures.",
    category: "CROWD_DENSITY",
    status: "OPEN",
    urgency: "HIGH",
    budget: { amountCents: 2800, currency: "USD" },
    locationId: tokyo.id,
    coordinates: tokyo.coordinates,
    radiusMeters: 800,
    requesterId: mockUsers[0]!.id,
    assignedScoutId: null,
    requiredTags: ["crossing", "queues", "photo"],
    expiresAt: inSixHours,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "44444444-4444-4444-8444-444444444402",
    title: "Times Square LED storefront opening status",
    description:
      "Confirm whether the flagged retail unit on 7th Ave is open, staffed, and accepting walk-ins this evening.",
    category: "VENUE_STATUS",
    status: "OPEN",
    urgency: "NORMAL",
    budget: { amountCents: 2200, currency: "USD" },
    locationId: newYork.id,
    coordinates: newYork.coordinates,
    radiusMeters: 600,
    requesterId: mockUsers[1]!.id,
    assignedScoutId: null,
    requiredTags: ["opening-hours", "retail"],
    expiresAt: inTwelveHours,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "44444444-4444-4444-8444-444444444403",
    title: "Borough Market stall availability sweep",
    description:
      "Check which produce and street-food stalls are operating this afternoon and whether queues exceed 10 minutes.",
    category: "PRODUCT_AVAILABILITY",
    status: "OPEN",
    urgency: "NORMAL",
    budget: { amountCents: 2500, currency: "USD" },
    locationId: london.id,
    coordinates: london.coordinates,
    radiusMeters: 500,
    requesterId: mockUsers[0]!.id,
    assignedScoutId: null,
    requiredTags: ["retail", "queues"],
    expiresAt: inTwelveHours,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "44444444-4444-4444-8444-444444444404",
    title: "Orchard Road rain and sidewalk conditions",
    description:
      "Report on-site rainfall intensity, standing water on sidewalks, and umbrella usage density near ION Orchard.",
    category: "WEATHER_ON_SITE",
    status: "OPEN",
    urgency: "HIGH",
    budget: { amountCents: 1900, currency: "USD" },
    locationId: singapore.id,
    coordinates: singapore.coordinates,
    radiusMeters: 1000,
    requesterId: mockUsers[1]!.id,
    assignedScoutId: null,
    requiredTags: ["rain", "mall"],
    expiresAt: inSixHours,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "44444444-4444-4444-8444-444444444405",
    title: "La Rambla street performer corridor check",
    description:
      "Verify whether the evening performer corridor is active, blocked, or relocated, with timestamped photos.",
    category: "LOCAL_EVENT",
    status: "OPEN",
    urgency: "LOW",
    budget: { amountCents: 1600, currency: "USD" },
    locationId: barcelona.id,
    coordinates: barcelona.coordinates,
    radiusMeters: 700,
    requesterId: mockUsers[0]!.id,
    assignedScoutId: null,
    requiredTags: ["street", "festival", "photo"],
    expiresAt: inOneDay,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "44444444-4444-4444-8444-444444444406",
    title: "Nguyen Hue night crowd and lighting",
    description:
      "Capture pedestrian flow, vendor density, and lighting quality along the walking street after 19:00.",
    category: "STREET_CONDITIONS",
    status: "OPEN",
    urgency: "NORMAL",
    budget: { amountCents: 1500, currency: "USD" },
    locationId: hcmc.id,
    coordinates: hcmc.coordinates,
    radiusMeters: 900,
    requesterId: mockUsers[1]!.id,
    assignedScoutId: null,
    requiredTags: ["walking-street", "night-life", "photo"],
    expiresAt: inOneDay,
    createdAt: now,
    updatedAt: now,
  },
];
