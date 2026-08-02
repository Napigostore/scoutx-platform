const { spawn, execSync } = require("child_process");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function run() {
  console.log("Starting Next.js dev server...");
  const devServer = spawn("pnpm", ["--filter", "@scoutx/web", "dev"], {
    shell: true,
    stdio: "inherit",
  });

  // Wait for server to be ready
  await new Promise((resolve) => setTimeout(resolve, 8000));

  try {
    // 1. Login as Requester
    console.log("Logging in as Requester...");
    const reqLoginRes = await fetch("http://localhost:3000/api/auth/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "demo@scoutx.local", password: "demo123" }),
    });
    const reqLoginData = await reqLoginRes.json();
    const reqToken = reqLoginData.accessToken.token;

    // 2. Create Mission
    console.log("Creating Mission...");
    const createRes = await fetch("http://localhost:3000/api/missions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${reqToken}`,
      },
      body: JSON.stringify({
        title: "E2E Concurrency Test Mission",
        description: "This is a test mission description with sufficient length.",
        category: "STREET_CONDITIONS",
        urgency: "NORMAL",
        budget: { amountCents: 5000, currency: "USD" },
        locationId: "00000000-0000-0000-0000-000000000001",
        coordinates: { latitude: 35.658034, longitude: 139.701636 },
        radiusMeters: 1500,
        requiredTags: ["test"],
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      }),
    });
    const mission = await createRes.json();
    const missionId = mission.id;
    console.log("Created Mission ID:", missionId);

    // 3. Publish Mission
    console.log("Publishing Mission...");
    await fetch(`http://localhost:3000/api/missions/${missionId}/publish`, {
      method: "POST",
      headers: { Authorization: `Bearer ${reqToken}` },
    });

    // 4. Login as Scout
    console.log("Logging in as Scout...");
    const scoutLoginRes = await fetch("http://localhost:3000/api/auth/sign-in", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "scout@scoutx.local", password: "scout123" }),
    });
    const scoutLoginData = await scoutLoginRes.json();
    const scoutToken = scoutLoginData.accessToken.token;

    // 5. Claim Mission
    console.log("Claiming Mission...");
    await fetch(`http://localhost:3000/api/scout/missions/${missionId}/claim`, {
      method: "POST",
      headers: { Authorization: `Bearer ${scoutToken}` },
    });

    // 6. Start Mission
    console.log("Starting Mission...");
    await fetch(`http://localhost:3000/api/scout/missions/${missionId}/start`, {
      method: "POST",
      headers: { Authorization: `Bearer ${scoutToken}` },
    });

    // 7. Send two concurrent submit requests
    console.log("Sending concurrent submit requests...");
    const payload1 = {
      summary: "First concurrent submission report with sufficient length.",
      mediaUrls: ["https://example.com/evidence1.jpg"],
      latitude: 35.658034,
      longitude: 139.701636,
    };
    const payload2 = {
      summary: "Second concurrent submission report with sufficient length.",
      mediaUrls: ["https://example.com/evidence2.jpg"],
      latitude: 35.658034,
      longitude: 139.701636,
    };

    const [res1, res2] = await Promise.all([
      fetch(`http://localhost:3000/api/scout/missions/${missionId}/submission`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${scoutToken}`,
        },
        body: JSON.stringify(payload1),
      }),
      fetch(`http://localhost:3000/api/scout/missions/${missionId}/submission`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${scoutToken}`,
        },
        body: JSON.stringify(payload2),
      }),
    ]);

    console.log("Request A Status:", res1.status);
    console.log("Request B Status:", res2.status);

    // 8. Verify database state
    const dbMission = await prisma.mission.findUnique({ where: { id: missionId } });
    const submissions = await prisma.missionSubmission.findMany({ where: { missionId } });

    console.log("Final Mission Status in DB:", dbMission.status);
    console.log("Number of Submissions in DB:", submissions.length);
    if (submissions.length > 0) {
      console.log("Winning Submission ID:", submissions[0].id);
      console.log("Winning Submission Summary:", submissions[0].summary);
    }

    // Cleanup test mission and submission
    console.log("Cleaning up test records...");
    await prisma.missionSubmission.deleteMany({ where: { missionId } });
    await prisma.mission.delete({ where: { id: missionId } });
  } catch (err) {
    console.error("Error during E2E test:", err);
  } finally {
    console.log("Stopping dev server...");
    devServer.kill();
    try {
      execSync("taskkill /F /IM node.exe", { stdio: "ignore" });
    } catch {}
  }
}

run();
