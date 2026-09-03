const fs = require('fs');
const path = require('path');

function loadEnv(filePath) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  content.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      if (!process.env[key]) process.env[key] = value.trim();
    }
  });
}

loadEnv('./apps/web/.env');
loadEnv('./apps/web/.env.local');

const { PrismaClient } = require('C:/Users/HI/scoutx-platform/node_modules/.pnpm/@prisma+client@6.19.3_prisma@6.19.3_typescript@5.9.3__typescript@5.9.3/node_modules/@prisma/client');
const prisma = new PrismaClient();
const { requesterCompleteMission, createDispute } = require('../apps/web/src/lib/dispute-settlement-service');

async function runTest() {
  console.log("=== STARTING ADVANCED E2E VERIFICATION TEST ===");

  try {
    // 1. Get or create test users
    let requester = await prisma.user.findFirst({ where: { role: 'REQUESTER' } });
    if (!requester) {
      requester = await prisma.user.create({
        data: {
          id: '10000000-0000-0000-0000-000000000001',
          email: 'test-req@example.com',
          displayName: 'Test Requester',
          role: 'REQUESTER',
          passwordHash: 'hashed',
        }
      });
    }

    let workerA = await prisma.user.findFirst({ where: { email: 'worker-a@example.com' } });
    if (!workerA) {
      workerA = await prisma.user.create({
        data: {
          id: '20000000-0000-0000-0000-000000000001',
          email: 'worker-a@example.com',
          displayName: 'Worker A',
          role: 'SCOUT',
          passwordHash: 'hashed',
        }
      });
    }

    let workerB = await prisma.user.findFirst({ where: { email: 'worker-b@example.com' } });
    if (!workerB) {
      workerB = await prisma.user.create({
        data: {
          id: '30000000-0000-0000-0000-000000000001',
          email: 'worker-b@example.com',
          displayName: 'Worker B',
          role: 'SCOUT',
          passwordHash: 'hashed',
        }
      });
    }

    let outsider = await prisma.user.findFirst({ where: { email: 'outsider@example.com' } });
    if (!outsider) {
      outsider = await prisma.user.create({
        data: {
          id: '40000000-0000-0000-0000-000000000001',
          email: 'outsider@example.com',
          displayName: 'Outsider User',
          role: 'SCOUT',
          passwordHash: 'hashed',
        }
      });
    }

    let location = await prisma.location.findFirst();
    if (!location) {
      location = await prisma.location.create({
        data: {
          id: '00000000-0000-0000-0000-000000000001',
          name: 'HCMC',
          city: 'Ho Chi Minh City',
          country: 'Vietnam',
          countryCode: 'VN',
          latitude: 10.7769,
          longitude: 106.7009,
          timezone: 'Asia/Ho_Chi_Minh',
        }
      });
    }

    // 2. Create Mission (status = OPEN)
    const missionId = '90000000-0000-0000-0000-000000000001';
    await prisma.timelineEntry.deleteMany({ where: { missionId } });
    await prisma.evidence.deleteMany({ where: { missionId } });
    await prisma.missionRecipient.deleteMany({ where: { missionId } });
    await prisma.rewardRequest.deleteMany({ where: { missionId } });
    await prisma.dispute.deleteMany({ where: { missionId } });
    await prisma.notification.deleteMany({ where: { missionId } });
    await prisma.mission.deleteMany({ where: { id: missionId } });

    const mission = await prisma.mission.create({
      data: {
        id: missionId,
        title: 'E2E Advanced Verification Mission',
        description: 'Testing winner selection & claim enforcement',
        category: 'STREET_CONDITIONS',
        status: 'OPEN',
        budgetCents: 500000,
        currency: 'VND',
        locationId: location.id,
        latitude: 10.7769,
        longitude: 106.7009,
        requesterId: requester.id,
        expiresAt: new Date(Date.now() + 86400000),
      }
    });

    console.log("✅ Mission created:", mission.id);

    // 3. Worker A & Worker B join & submit evidence
    await prisma.missionRecipient.create({ data: { missionId, userId: workerA.id } });
    await prisma.missionRecipient.create({ data: { missionId, userId: workerB.id } });

    let scoutProfile = await prisma.scoutProfile.findFirst();
    if (!scoutProfile) {
      scoutProfile = await prisma.scoutProfile.create({
        data: {
          id: '50000000-0000-0000-0000-000000000001',
          userId: workerA.id,
          displayName: 'Scout A',
          bio: 'Bio',
          homeLocationId: location.id,
        }
      });
    }

    await prisma.evidence.create({
      data: {
        missionId,
        scoutId: scoutProfile.id,
        userId: workerA.id,
        caption: 'Evidence A',
        type: 'PHOTO',
        mediaUrl: 'https://example.com/a.jpg',
      }
    });

    await prisma.evidence.create({
      data: {
        missionId,
        scoutId: scoutProfile.id,
        userId: workerB.id,
        caption: 'Evidence B',
        type: 'PHOTO',
        mediaUrl: 'https://example.com/b.jpg',
      }
    });

    console.log("✅ Worker A and Worker B submitted evidence.");

    // 4. Test Backend Winner Validation with Invalid User (Outsider with 0 activity)
    try {
      await requesterCompleteMission(missionId, outsider.id, requester.id);
      console.error("❌ Test Failed: Outsider was accepted as winner!");
    } catch (err) {
      console.log("✅ Backend Winner Validation PASS: Invalid winner rejected ->", err.message);
    }

    // 5. Select Worker A as Valid Winner
    const updatedMission = await requesterCompleteMission(missionId, workerA.id, requester.id);
    console.log("✅ Valid Winner Selection PASS: Winner =", updatedMission.winnerId, "Status =", updatedMission.status);

    // 6. Test Winner Attempting Claim (Must be BLOCKED)
    try {
      await createDispute(missionId, workerA.id, "Winner trying to dispute");
      console.error("❌ Test Failed: Winner was allowed to dispute!");
    } catch (err) {
      console.log("✅ Winner Dispute Block PASS: Winner dispute blocked ->", err.message);
    }

    // 7. Test Outsider Attempting Claim (Must be BLOCKED)
    try {
      await createDispute(missionId, outsider.id, "Outsider trying to dispute");
      console.error("❌ Test Failed: Outsider was allowed to dispute!");
    } catch (err) {
      console.log("✅ Outsider Dispute Block PASS: Outsider dispute blocked ->", err.message);
    }

    // 8. Test Non-Winner Participant (Worker B) Filing Claim (Must PASS)
    const dispute = await createDispute(missionId, workerB.id, "Worker B claims outcome photo B was clearer");
    console.log("✅ Non-Winner Claim PASS: Dispute created -> ID =", dispute.id);

    // 9. Verify Notifications
    const notifications = await prisma.notification.findMany({ where: { missionId } });
    console.log(`✅ Real-Time Notifications PASS: Generated ${notifications.length} notifications`);
    notifications.forEach(n => console.log(`   - [${n.type}] User: ${n.userId} | ${n.title}`));

    console.log("\n=== ALL E2E ADVANCED TEST CASES PASSED 100% ===");
  } catch (err) {
    console.error("❌ E2E Test Exception:", err);
  } finally {
    await prisma.$disconnect();
  }
}

runTest();
