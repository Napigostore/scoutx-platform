import { PrismaClient, UserRole, MissionCategory, MissionStatus, MissionUrgency, ScoutAvailability, EvidenceType } from "@prisma/client";

const prisma = new PrismaClient();

const LOCATIONS_DATA = [
  { id: "a0000000-0000-0000-0000-000000000001", name: "District 1 Financial Center", city: "Ho Chi Minh City", country: "Vietnam", countryCode: "VN", latitude: 10.7769, longitude: 106.7009, timezone: "Asia/Ho_Chi_Minh" },
  { id: "a0000000-0000-0000-0000-000000000002", name: "Hoan Kiem Central District", city: "Hanoi", country: "Vietnam", countryCode: "VN", latitude: 21.0285, longitude: 105.8542, timezone: "Asia/Ho_Chi_Minh" },
  { id: "a0000000-0000-0000-0000-000000000003", name: "Hai Chau Waterfront", city: "Da Nang", country: "Vietnam", countryCode: "VN", latitude: 16.0544, longitude: 108.2022, timezone: "Asia/Ho_Chi_Minh" },
  { id: "a0000000-0000-0000-0000-000000000004", name: "Ninh Kieu Port Area", city: "Can Tho", country: "Vietnam", countryCode: "VN", latitude: 10.0452, longitude: 105.7469, timezone: "Asia/Ho_Chi_Minh" },
  { id: "a0000000-0000-0000-0000-000000000005", name: "Ngo Quyen Port Terminal", city: "Hai Phong", country: "Vietnam", countryCode: "VN", latitude: 20.8449, longitude: 106.6881, timezone: "Asia/Ho_Chi_Minh" },
  { id: "a0000000-0000-0000-0000-000000000006", name: "District 7 Saigon South", city: "Ho Chi Minh City", country: "Vietnam", countryCode: "VN", latitude: 10.7326, longitude: 106.7031, timezone: "Asia/Ho_Chi_Minh" },
  { id: "a0000000-0000-0000-0000-000000000007", name: "Cau Giay Tech Zone", city: "Hanoi", country: "Vietnam", countryCode: "VN", latitude: 21.0362, longitude: 105.7906, timezone: "Asia/Ho_Chi_Minh" },
  { id: "a0000000-0000-0000-0000-000000000008", name: "Son Tra Coastal Reserve", city: "Da Nang", country: "Vietnam", countryCode: "VN", latitude: 16.0889, longitude: 108.2750, timezone: "Asia/Ho_Chi_Minh" },
  { id: "a0000000-0000-0000-0000-000000000009", name: "Nha Trang Bay Promenade", city: "Nha Trang", country: "Vietnam", countryCode: "VN", latitude: 12.2388, longitude: 109.1967, timezone: "Asia/Ho_Chi_Minh" },
  { id: "a0000000-0000-0000-0000-000000000010", name: "Shibuya Crossing District", city: "Tokyo", country: "Japan", countryCode: "JP", latitude: 35.6580, longitude: 139.7016, timezone: "Asia/Tokyo" }
];

const FIRST_NAMES = [
  "Minh", "Linh", "Duc", "An", "Bao", "Trang", "Huy", "Vy", "Tuan", "Mai",
  "Nam", "Khoa", "Thao", "Phuc", "Quyen", "Thanh", "Kiet", "Ngan", "Hung", "Ha",
  "Tien", "Yen", "Quang", "Nhu", "Khanh", "Son", "Phuong", "Duy", "Chi", "Hoang",
  "Lan", "Long", "Giang", "Nhat", "Dat", "Nhan", "Tram", "Tri", "Van", "Tam",
  "Bich", "Cuong", "Diep", "Kien", "Loan", "Phong", "Quan", "Tu", "Viet", "Xuan"
];

const LAST_NAMES = [
  "Tran", "Nguyen", "Pham", "Vo", "Hoang", "Le", "Dang", "Bui", "Do", "Truong",
  "Phan", "Dinh", "Vu", "Ngo", "Lai", "Ly", "Trinh", "Duong", "Mac", "Cao"
];

const REQUESTER_ORGS = [
  "Global Infrastructure Group", "Maritime Logistics Corp", "VinGroup Retail Audit",
  "Urban Mobility Analytics", "GreenCharge Energy Asia", "EcoSurv Compliance Int",
  "FMCG Intelligence Co", "TransAsia Supply Chain", "BrandMetrics SEA", "Heritage Preservation NGO"
];

const MISSION_TEMPLATES = [
  { prefix: "Retail Audit", category: MissionCategory.PRODUCT_AVAILABILITY, tags: ["retail_audit", "shelf_check", "geotagged"] },
  { prefix: "Restaurant & Hygiene Check", category: MissionCategory.VENUE_STATUS, tags: ["restaurant_audit", "hygiene_check"] },
  { prefix: "Location & Storefront Verification", category: MissionCategory.PHOTO_VERIFICATION, tags: ["storefront_photo", "location_check"] },
  { prefix: "Competitor Price Survey", category: MissionCategory.GENERAL_OBSERVATION, tags: ["price_check", "competitor_intel"] },
  { prefix: "Mystery Shopping & Staff Service", category: MissionCategory.VENUE_STATUS, tags: ["mystery_shopping", "service_quality"] },
  { prefix: "Peak Traffic & Congestion Density", category: MissionCategory.CROWD_DENSITY, tags: ["traffic_count", "peak_hours"] },
  { prefix: "EV Charging Infrastructure Audit", category: MissionCategory.STREET_CONDITIONS, tags: ["ev_charger", "status_check"] },
  { prefix: "Local Market Intelligence Survey", category: MissionCategory.LOCAL_EVENT, tags: ["market_intel", "on_site"] },
  { prefix: "Weather & Flood Condition Check", category: MissionCategory.WEATHER_ON_SITE, tags: ["weather_check", "flooding_status"] },
  { prefix: "Outdoor Billboard & Ad Placement Audit", category: MissionCategory.PHOTO_VERIFICATION, tags: ["billboard_check", "ad_audit"] },
];

export async function runProductionSeed() {
  console.log("==========================================================");
  console.log("   SCOUTX PRODUCTION DEMO IDEMPOTENT SEED EXECUTION");
  console.log("==========================================================");

  // 0. Read-Only DB Connection Audit
  console.log("[STEP 0/5] Read-Only DB Connection Audit...");
  let targetDbName = "unknown";
  try {
    const dbAudit = await prisma.$queryRaw<Array<{ current_database: string }>>`SELECT current_database();`;
    targetDbName = dbAudit[0]?.current_database || "unknown";
    console.log(`  -> Connected Target Database: ${targetDbName}`);
  } catch (err: unknown) {
    const e = err as Error;
    console.log(`  -> Read-only query notice: ${e.message}`);
  }

  // 1. Seed Locations
  console.log("[STEP 1/5] Seeding Locations...");
  const seededLocations = [];
  for (const locData of LOCATIONS_DATA) {
    const loc = await prisma.location.upsert({
      where: { id: locData.id },
      update: { name: locData.name, city: locData.city, country: locData.country },
      create: locData,
    });
    seededLocations.push(loc);
  }
  console.log(`  -> Seeded ${seededLocations.length} locations.`);

  // 2. Seed Requesters (10 orgs)
  console.log("[STEP 2/5] Seeding 10 Requester Accounts...");
  const seededRequesters = [];
  for (let i = 1; i <= 10; i++) {
    const numStr = String(i).padStart(2, "0");
    const email = `mock-requester-${numStr}@seed.fiwokan.com`;
    const orgName = REQUESTER_ORGS[i - 1] || `Requester Org #${numStr}`;

    const user = await prisma.user.upsert({
      where: { email },
      update: { displayName: orgName, reliabilityScore: 90 + i },
      create: {
        email,
        displayName: orgName,
        role: UserRole.REQUESTER,
        passwordHash: "hashed:MockScout123!",
        reliabilityScore: 90 + i,
        avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=org_${i}`,
      },
    });

    await prisma.trustScore.upsert({
      where: { userId: user.id },
      update: { score: 90 + i },
      create: { userId: user.id, score: 90 + i },
    });

    seededRequesters.push(user);
  }
  console.log(`  -> Seeded ${seededRequesters.length} requester accounts.`);

  // 3. Seed 50 Mock Scout Users & ScoutProfiles
  console.log("[STEP 3/5] Seeding 50 Mock Scout Accounts & Profiles...");
  const seededScouts = [];

  for (let i = 1; i <= 50; i++) {
    const numStr = String(i).padStart(2, "0");
    const email = `mock-user-${numStr}@seed.fiwokan.com`;
    const firstName = FIRST_NAMES[(i - 1) % FIRST_NAMES.length] || "Scout";
    const lastName = LAST_NAMES[(i - 1) % LAST_NAMES.length] || "Operator";
    const name = `${firstName} ${lastName}`;

    let reputation: number;
    let reliabilityScore: number;
    let completedMissions: number;

    if (i <= 10) {
      reputation = Math.round((5.0 - (i - 1) * 0.02) * 100) / 100;
      reliabilityScore = Math.round(reputation * 20);
      completedMissions = Math.max(80, Math.round(185 * Math.pow(0.92, i - 1)));
    } else if (i <= 30) {
      reputation = Math.round((4.7 - (i - 11) * 0.035) * 100) / 100;
      reliabilityScore = Math.round(reputation * 20);
      completedMissions = Math.max(25, Math.round(75 * Math.pow(0.95, i - 11)));
    } else {
      reputation = Math.max(1.0, Math.round((3.9 - (i - 31) * 0.14) * 100) / 100);
      reliabilityScore = Math.round(reputation * 20);
      completedMissions = Math.max(1, Math.round(20 * Math.pow(0.85, i - 31)));
    }

    const user = await prisma.user.upsert({
      where: { email },
      update: { displayName: name, reliabilityScore },
      create: {
        email,
        displayName: name,
        role: UserRole.SCOUT,
        passwordHash: "hashed:MockScout123!",
        reliabilityScore,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=scout_${i}`,
      },
    });

    await prisma.trustScore.upsert({
      where: { userId: user.id },
      update: { score: reliabilityScore },
      create: { userId: user.id, score: reliabilityScore },
    });

    const homeLocation = seededLocations[(i - 1) % seededLocations.length] || seededLocations[0];
    const locationId = homeLocation?.id || seededLocations[0]?.id || "a0000000-0000-0000-0000-000000000001";

    const scoutProfile = await prisma.scoutProfile.upsert({
      where: { userId: user.id },
      update: {
        displayName: name,
        bio: `Certified Field Operator #${numStr} specializing in geotagged verification & retail audit.`,
        reliabilityScore,
        completedMissions,
        availability: i % 5 === 0 ? ScoutAvailability.BUSY : ScoutAvailability.AVAILABLE,
        homeLocationId: locationId,
      },
      create: {
        userId: user.id,
        displayName: name,
        bio: `Certified Field Operator #${numStr} specializing in geotagged verification & retail audit.`,
        availability: i % 5 === 0 ? ScoutAvailability.BUSY : ScoutAvailability.AVAILABLE,
        reliabilityScore,
        completedMissions,
        categories: [MissionCategory.PHOTO_VERIFICATION, MissionCategory.STREET_CONDITIONS, MissionCategory.PRODUCT_AVAILABILITY],
        tags: ["geotagged", "fast_responder", "field_audit"],
        homeLocationId: locationId,
        maxRadiusMeters: 10000,
        languages: ["Vietnamese", "English"],
      },
    });

    seededScouts.push({ user, profile: scoutProfile, rank: i, reputation, completedMissions });
  }
  console.log(`  -> Seeded ${seededScouts.length} scout users & profiles.`);

  // 4. Seed 100+ Mock Missions (Int32 safe budget bounds)
  console.log("[STEP 4/5] Seeding 100+ Mock Missions across 4 leaderboard categories...");
  const seededMissions = [];

  for (let i = 1; i <= 100; i++) {
    const numStr = String(i).padStart(3, "0");
    const template = MISSION_TEMPLATES[(i - 1) % MISSION_TEMPLATES.length] || MISSION_TEMPLATES[0]!;
    const loc = seededLocations[(i - 1) % seededLocations.length] || seededLocations[0]!;
    const requester = seededRequesters[(i - 1) % seededRequesters.length] || seededRequesters[0]!;

    let budgetCents: number;
    if (i === 1) budgetCents = 2000000000;
    else if (i === 2) budgetCents = 1500000000;
    else if (i === 3) budgetCents = 1000000000;
    else if (i === 4) budgetCents = 750000000;
    else if (i === 5) budgetCents = 500000000;
    else if (i <= 25) budgetCents = Math.round(250000000 * Math.pow(0.85, i - 6));
    else if (i <= 70) budgetCents = Math.round(15000000 * Math.pow(0.92, i - 26));
    else budgetCents = Math.max(100000, Math.round(800000 * Math.pow(0.94, i - 71)));

    let urgency: MissionUrgency = MissionUrgency.NORMAL;
    if (i % 4 === 1) urgency = MissionUrgency.CRITICAL;
    else if (i % 3 === 0) urgency = MissionUrgency.HIGH;
    else if (i % 5 === 0) urgency = MissionUrgency.LOW;

    let status: MissionStatus = MissionStatus.OPEN;
    let hoursUntilExpire = 48;
    if (i <= 10) {
      hoursUntilExpire = 2 + (i % 6);
    } else if (i % 4 === 0) {
      status = MissionStatus.COMPLETED;
    } else if (i % 3 === 0) {
      status = MissionStatus.IN_PROGRESS;
    }

    const expiresAt = new Date(Date.now() + hoursUntilExpire * 3600 * 1000);
    const title = `[Seed #${numStr}] ${template.prefix} - ${loc.name}, ${loc.city}`;
    const description = `Field verification audit for ${template.prefix} in ${loc.city}. Collect geotagged high-res photos and on-site observations.`;

    const assignedScoutObj = seededScouts[(i - 1) % seededScouts.length] || seededScouts[0]!;
    const assignedScoutId = (status === MissionStatus.IN_PROGRESS || status === MissionStatus.COMPLETED)
      ? assignedScoutObj.profile.id
      : null;

    const missionId = `b0000000-0000-0000-0000-${numStr.padStart(12, "0")}`;

    const mission = await prisma.mission.upsert({
      where: { id: missionId },
      update: {
        title,
        description,
        category: template.category,
        urgency,
        budgetCents,
        status,
        expiresAt,
        assignedScoutId,
      },
      create: {
        id: missionId,
        title,
        description,
        category: template.category,
        status,
        urgency,
        budgetCents,
        currency: "VND",
        locationId: loc.id,
        latitude: loc.latitude,
        longitude: loc.longitude,
        radiusMeters: 1500,
        requesterId: requester.id,
        assignedScoutId,
        requiredTags: template.tags,
        expiresAt,
      },
    });

    if (status === MissionStatus.COMPLETED || status === MissionStatus.IN_PROGRESS || i <= 20) {
      const scoutObj = assignedScoutObj || seededScouts[0]!;
      const evidenceId = `c0000000-0000-0000-0000-${numStr.padStart(12, "0")}`;

      await prisma.evidence.upsert({
        where: { id: evidenceId },
        update: { verified: true },
        create: {
          id: evidenceId,
          missionId: mission.id,
          scoutId: scoutObj.profile.id,
          userId: scoutObj.user.id,
          caption: `Geotagged photo audit evidence for ${template.prefix}`,
          type: EvidenceType.PHOTO,
          mediaUrl: `https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600&auto=format&fit=crop&q=80`,
          latitude: loc.latitude,
          longitude: loc.longitude,
          location: `${loc.name}, ${loc.city}`,
          verified: true,
        },
      });

      const timelineId = `d0000000-0000-0000-0000-${numStr.padStart(12, "0")}`;
      await prisma.timelineEntry.upsert({
        where: { id: timelineId },
        update: { summary: `Evidence verified by ${scoutObj.user.displayName}` },
        create: {
          id: timelineId,
          missionId: mission.id,
          eventType: "EVIDENCE_SUBMITTED",
          summary: `Evidence verified by ${scoutObj.user.displayName}`,
          actorId: scoutObj.user.id,
          metadata: { seedSource: "mock-production-demo", location: loc.city },
        },
      });
    }

    seededMissions.push(mission);
  }
  console.log(`  -> Seeded ${seededMissions.length} mock missions with evidence & timeline logs.`);

  // 5. Audit Metrics Reporting
  console.log("[STEP 5/5] Generating Summary Report...");

  const mockUsersCount = await prisma.user.count({
    where: { email: { endsWith: "@seed.fiwokan.com" } },
  });

  const scoutProfilesCount = await prisma.scoutProfile.count({
    where: { user: { email: { endsWith: "@seed.fiwokan.com" } } },
  });

  const mockMissionsCount = await prisma.mission.count({
    where: { requester: { email: { endsWith: "@seed.fiwokan.com" } } },
  });

  const submissionsCount = await prisma.evidence.count({
    where: { user: { email: { endsWith: "@seed.fiwokan.com" } } },
  });

  const openMissions = await prisma.mission.count({ where: { status: MissionStatus.OPEN, requester: { email: { endsWith: "@seed.fiwokan.com" } } } });
  const inProgressMissions = await prisma.mission.count({ where: { status: MissionStatus.IN_PROGRESS, requester: { email: { endsWith: "@seed.fiwokan.com" } } } });
  const completedMissions = await prisma.mission.count({ where: { status: MissionStatus.COMPLETED, requester: { email: { endsWith: "@seed.fiwokan.com" } } } });

  const realPayments = await prisma.coinTransaction.count();

  return {
    targetDbName,
    mockUsersCount,
    scoutProfilesCount,
    mockMissionsCount,
    openMissions,
    inProgressMissions,
    completedMissions,
    submissionsCount,
    realPaymentsCount: realPayments,
  };
}

if (require.main === module) {
  runProductionSeed()
    .catch((e) => {
      console.error("[SEED_ERROR]", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
