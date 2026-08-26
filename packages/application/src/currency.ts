export const CANONICAL_CURRENCY = "USD";

export type MissionDifficultyLevel = "VERY_SIMPLE" | "SIMPLE" | "MEDIUM" | "HARD" | "VERY_HARD";

export interface RewardTierConfig {
  level: MissionDifficultyLevel;
  label: string;
  usdAmount: number;
  centsAmount: number;
  formattedUSD: string;
}

export const REWARD_TIER_CONFIG: Record<MissionDifficultyLevel, RewardTierConfig> = {
  VERY_SIMPLE: {
    level: "VERY_SIMPLE",
    label: "Rất đơn giản ($2)",
    usdAmount: 2,
    centsAmount: 200,
    formattedUSD: "$2",
  },
  SIMPLE: {
    level: "SIMPLE",
    label: "Đơn giản ($5)",
    usdAmount: 5,
    centsAmount: 500,
    formattedUSD: "$5",
  },
  MEDIUM: {
    level: "MEDIUM",
    label: "Trung bình ($10)",
    usdAmount: 10,
    centsAmount: 1000,
    formattedUSD: "$10",
  },
  HARD: {
    level: "HARD",
    label: "Khó ($20)",
    usdAmount: 20,
    centsAmount: 2000,
    formattedUSD: "$20",
  },
  VERY_HARD: {
    level: "VERY_HARD",
    label: "Rất khó / Nhiệm vụ đặc biệt ($50)",
    usdAmount: 50,
    centsAmount: 5000,
    formattedUSD: "$50",
  },
};

/**
 * Centralized mapping of mission category & urgency (or explicit difficulty level) to USD reward tier.
 */
export function getRewardUSDByDifficulty(
  categoryOrDifficulty?: string,
  urgency?: string
): RewardTierConfig {
  const normCategory = (categoryOrDifficulty || "").toUpperCase();
  const normUrgency = (urgency || "").toUpperCase();

  if (normCategory === "VERY_SIMPLE" || normCategory === "LOW") return REWARD_TIER_CONFIG.VERY_SIMPLE;
  if (normCategory === "SIMPLE" || normCategory === "EASY") return REWARD_TIER_CONFIG.SIMPLE;
  if (normCategory === "MEDIUM" || normCategory === "NORMAL") return REWARD_TIER_CONFIG.MEDIUM;
  if (normCategory === "HARD" || normCategory === "HIGH") return REWARD_TIER_CONFIG.HARD;
  if (normCategory === "VERY_HARD" || normCategory === "CRITICAL") return REWARD_TIER_CONFIG.VERY_HARD;

  if (normUrgency === "CRITICAL" || normCategory === "LOCAL_EVENT") {
    return REWARD_TIER_CONFIG.VERY_HARD;
  }
  if (normUrgency === "HIGH" || normCategory === "CROWD_DENSITY" || normCategory === "VENUE_STATUS") {
    return REWARD_TIER_CONFIG.HARD;
  }
  if (normCategory === "STREET_CONDITIONS" || normCategory === "PRODUCT_AVAILABILITY") {
    return REWARD_TIER_CONFIG.MEDIUM;
  }
  if (normCategory === "PHOTO_VERIFICATION" || normCategory === "WEATHER_ON_SITE") {
    return REWARD_TIER_CONFIG.SIMPLE;
  }

  return REWARD_TIER_CONFIG.SIMPLE;
}

/**
 * Formats a reward or budget integer into clean USD display string (e.g. $5, $10, $20, $50).
 * Handles backward compatibility with legacy VND values and raw dollar values safely.
 */
export function formatRewardUSD(amount: number, currency: string = CANONICAL_CURRENCY): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return "$0";
  }

  const cleanCurrency = (currency || CANONICAL_CURRENCY).trim().toUpperCase();

  // Backward compatibility: If legacy data was stored in VND (or large integer >= 10,000)
  if (cleanCurrency === "VND" || amount >= 10000) {
    // Test phase exchange mapping (25,000 VND = $1 USD)
    const usdVal = Math.round(amount / 25000);
    const roundedUsd = Math.max(usdVal, 1);
    return `$${roundedUsd}`;
  }

  // Standard USD cents (e.g. 500 = $5, 1000 = $10, 2000 = $20)
  if (amount >= 100) {
    const dollars = amount / 100;
    if (dollars % 1 === 0) {
      return `$${dollars}`;
    }
    return `$${dollars.toFixed(2)}`;
  }

  // Raw whole dollar integer (e.g. 5, 10, 20)
  if (amount > 0) {
    return `$${Math.round(amount)}`;
  }

  return "$0";
}

/**
 * Primary currency formatting helper. Alias to formatRewardUSD for primary USD display.
 */
export function formatCurrency(amount: number, currency: string = CANONICAL_CURRENCY): string {
  return formatRewardUSD(amount, currency);
}
