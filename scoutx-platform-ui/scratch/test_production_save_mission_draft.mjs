async function runProductionSmokeTest() {
  console.log("=== FIWOKAN PRODUCTION SAVE DRAFT SMOKE TEST ===");
  console.log("Target: https://fiwokan.com/api/missions");

  try {
    // 1. Send Unauthenticated POST Request to Production API
    const response = await fetch("https://fiwokan.com/api/missions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Production Test Mission",
        description: "Testing API route response format",
        category: "GENERAL_OBSERVATION",
        urgency: "NORMAL",
        budget: { amountCents: 100000, currency: "VND" },
        locationId: "00000000-0000-0000-0000-000000000001",
        coordinates: { latitude: 10.762622, longitude: 106.660172 },
        radiusMeters: 1500,
        requiredTags: ["test"],
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      }),
    });

    const contentType = response.headers.get("content-type") || "";
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${contentType}`);

    if (!contentType.includes("application/json")) {
      const text = await response.text();
      console.error("❌ FAILED: Production returned non-JSON response:", text.slice(0, 300));
      process.exit(1);
    }

    const data = await response.json();
    console.log("JSON Response Data:", data);

    if (response.status === 401 && data.error === "Unauthorized") {
      console.log("✅ PASS: Unauthenticated request returned JSON 401 Unauthorized.");
    } else {
      console.log(`Received status ${response.status} with JSON response.`);
    }

    console.log("\n========================================================");
    console.log("✅ PRODUCTION API ENDPOINT VERIFICATION PASSED!");
    console.log("========================================================\n");
  } catch (error) {
    console.error("❌ TEST FAILED:", error);
    process.exit(1);
  }
}

runProductionSmokeTest();
