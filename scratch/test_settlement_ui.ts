// Unit test for settlement worker status rendering logic

interface UserContext {
  isRequester: boolean;
  isWinner?: boolean;
  hasRequestedReward?: boolean;
  isAssignedOrRecipient?: boolean;
  hasSubmittedReport?: boolean;
  hasSubmittedEvidence?: boolean;
  canDispute?: boolean;
}

function getStatusBannerText(status: string, userContext: UserContext): { text: string | null; canDispute: boolean } {
  // Case 1: Before Winner Selected (Pending reward request)
  if (
    !userContext.isRequester &&
    !userContext.isWinner &&
    userContext.hasRequestedReward &&
    status !== "COMPLETED_PENDING_SETTLEMENT" &&
    status !== "SETTLEMENT_PENDING" &&
    status !== "COMPLETED" &&
    status !== "REWARDED"
  ) {
    return {
      text: "⏳ Đã yêu cầu trả thưởng — Chờ người giao trả lời hoặc chờ nhiệm vụ hết thời gian.",
      canDispute: false,
    };
  }

  // Case 2: Worker Selected Winner (24h Settlement Pending)
  if (
    userContext.isWinner &&
    (status === "COMPLETED_PENDING_SETTLEMENT" || status === "SETTLEMENT_PENDING")
  ) {
    return {
      text: "Bạn sẽ trở thành người chiến thắng trong vòng 24h không có khiếu nại",
      canDispute: false, // Winner cannot dispute
    };
  }

  // Case 3: Final Winner (24h Settlement Complete)
  if (userContext.isWinner && (status === "COMPLETED" || status === "REWARDED")) {
    return {
      text: "🏆 You win!",
      canDispute: false, // Final winner cannot dispute
    };
  }

  // Case 4: Non-Winner Participant (24h Settlement Pending)
  if (
    !userContext.isRequester &&
    !userContext.isWinner &&
    (userContext.isAssignedOrRecipient ||
      userContext.hasSubmittedReport ||
      userContext.hasSubmittedEvidence ||
      userContext.hasRequestedReward) &&
    (status === "COMPLETED_PENDING_SETTLEMENT" || status === "SETTLEMENT_PENDING")
  ) {
    return {
      text: "Người giao đã chọn người chiến thắng khác bạn có thể khiếu nại trong vòng 24h",
      canDispute: true, // Non-winner participant can dispute within 24h
    };
  }

  return { text: null, canDispute: false };
}

console.log("=== RUNNING SETTLEMENT WORKER STATUS UNIT TESTS ===");

// 1. Before Winner Selection
const c1 = getStatusBannerText("OPEN", { isRequester: false, isWinner: false, hasRequestedReward: true });
console.log("CASE 1 (Before Winner):", c1.text);
if (c1.text !== "⏳ Đã yêu cầu trả thưởng — Chờ người giao trả lời hoặc chờ nhiệm vụ hết thời gian.") {
  throw new Error("Case 1 Failed!");
}

// 2. Worker Winner (24h Settlement Pending)
const c2 = getStatusBannerText("COMPLETED_PENDING_SETTLEMENT", { isRequester: false, isWinner: true, hasRequestedReward: true });
console.log("CASE 2 (Winner Pending):", c2.text);
if (c2.text !== "Bạn sẽ trở thành người chiến thắng trong vòng 24h không có khiếu nại" || c2.canDispute !== false) {
  throw new Error("Case 2 Failed!");
}

// 3. Worker Non-Winner (24h Settlement Pending)
const c3 = getStatusBannerText("COMPLETED_PENDING_SETTLEMENT", { isRequester: false, isWinner: false, hasRequestedReward: true });
console.log("CASE 3 (Non-Winner Pending):", c3.text);
if (c3.text !== "Người giao đã chọn người chiến thắng khác bạn có thể khiếu nại trong vòng 24h" || c3.canDispute !== true) {
  throw new Error("Case 3 Failed!");
}

// 4. Final Winner (After 24h)
const c4 = getStatusBannerText("COMPLETED", { isRequester: false, isWinner: true, hasRequestedReward: true });
console.log("CASE 4 (Final Winner):", c4.text);
if (c4.text !== "🏆 You win!" || c4.canDispute !== false) {
  throw new Error("Case 4 Failed!");
}

console.log("=== ALL 4 SETTLEMENT WORKER STATUS TEST CASES PASSED 100% ===");
