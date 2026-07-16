import type { ScoutProfile } from "@scoutx/types";

import { mockLocations } from "./locations.js";
import { mockUsers } from "./users.js";

const now = new Date("2026-07-16T10:00:00.000Z");

const tokyo = mockLocations[0]!;
const newYork = mockLocations[1]!;
const london = mockLocations[2]!;
const singapore = mockLocations[3]!;
const barcelona = mockLocations[4]!;
const hcmc = mockLocations[5]!;

export const mockScouts: ScoutProfile[] = [
  {
    id: "33333333-3333-4333-8333-333333333301",
    userId: mockUsers[2]!.id,
    displayName: mockUsers[2]!.displayName,
    bio: "City-core scout specializing in crowd density and venue status across London.",
    availability: "AVAILABLE",
    reliabilityScore: 96,
    completedMissions: 214,
    categories: ["CROWD_DENSITY", "VENUE_STATUS", "LOCAL_EVENT"],
    tags: ["night-life", "transit", "queues", "photo"],
    homeLocationId: london.id,
    currentCoordinates: {
      latitude: london.coordinates.latitude + 0.004,
      longitude: london.coordinates.longitude - 0.002,
    },
    maxRadiusMeters: 8000,
    languages: ["en", "yo"],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "33333333-3333-4333-8333-333333333302",
    userId: mockUsers[3]!.id,
    displayName: mockUsers[3]!.displayName,
    bio: "Tokyo street observer focused on crossings, retail stock, and weather-on-site reports.",
    availability: "AVAILABLE",
    reliabilityScore: 91,
    completedMissions: 168,
    categories: ["STREET_CONDITIONS", "PRODUCT_AVAILABILITY", "WEATHER_ON_SITE"],
    tags: ["retail", "crossing", "photo", "rain"],
    homeLocationId: tokyo.id,
    currentCoordinates: {
      latitude: tokyo.coordinates.latitude - 0.002,
      longitude: tokyo.coordinates.longitude + 0.001,
    },
    maxRadiusMeters: 6000,
    languages: ["ja", "en"],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "33333333-3333-4333-8333-333333333303",
    userId: mockUsers[4]!.id,
    displayName: mockUsers[4]!.displayName,
    bio: "Barcelona pedestrian corridors and event verification specialist.",
    availability: "BUSY",
    reliabilityScore: 87,
    completedMissions: 132,
    categories: ["LOCAL_EVENT", "PHOTO_VERIFICATION", "GENERAL_OBSERVATION"],
    tags: ["festival", "street", "photo", "tourist"],
    homeLocationId: barcelona.id,
    currentCoordinates: {
      latitude: barcelona.coordinates.latitude + 0.001,
      longitude: barcelona.coordinates.longitude + 0.001,
    },
    maxRadiusMeters: 7000,
    languages: ["es", "ca", "en"],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "33333333-3333-4333-8333-333333333304",
    userId: mockUsers[5]!.id,
    displayName: mockUsers[5]!.displayName,
    bio: "Manhattan midtown scout for product checks and venue opening status.",
    availability: "AVAILABLE",
    reliabilityScore: 84,
    completedMissions: 97,
    categories: ["PRODUCT_AVAILABILITY", "VENUE_STATUS", "STREET_CONDITIONS"],
    tags: ["retail", "opening-hours", "queues"],
    homeLocationId: newYork.id,
    currentCoordinates: {
      latitude: newYork.coordinates.latitude + 0.003,
      longitude: newYork.coordinates.longitude - 0.001,
    },
    maxRadiusMeters: 5000,
    languages: ["en", "ko"],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "33333333-3333-4333-8333-333333333305",
    userId: mockUsers[6]!.id,
    displayName: mockUsers[6]!.displayName,
    bio: "Southeast Asia scout covering Singapore and nearby corridors.",
    availability: "AVAILABLE",
    reliabilityScore: 93,
    completedMissions: 181,
    categories: ["WEATHER_ON_SITE", "CROWD_DENSITY", "GENERAL_OBSERVATION"],
    tags: ["mall", "rain", "transit", "photo"],
    homeLocationId: singapore.id,
    currentCoordinates: {
      latitude: singapore.coordinates.latitude + 0.002,
      longitude: singapore.coordinates.longitude - 0.001,
    },
    maxRadiusMeters: 9000,
    languages: ["en", "ta", "hi"],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "33333333-3333-4333-8333-333333333306",
    userId: mockUsers[2]!.id,
    displayName: "Aisha Okonkwo (HCMC)",
    bio: "Visiting scout covering downtown Ho Chi Minh City walking streets.",
    availability: "AVAILABLE",
    reliabilityScore: 96,
    completedMissions: 214,
    categories: ["STREET_CONDITIONS", "LOCAL_EVENT", "PHOTO_VERIFICATION"],
    tags: ["walking-street", "photo", "night-life"],
    homeLocationId: hcmc.id,
    currentCoordinates: {
      latitude: hcmc.coordinates.latitude + 0.0015,
      longitude: hcmc.coordinates.longitude - 0.0008,
    },
    maxRadiusMeters: 5000,
    languages: ["en", "yo"],
    createdAt: now,
    updatedAt: now,
  },
];
