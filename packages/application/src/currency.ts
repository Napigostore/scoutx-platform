export const CANONICAL_CURRENCY = "VND";

/**
 * Formats a monetary integer amount according to its currency.
 * - VND: integer represents whole VND (e.g. 100000 -> 100.000 ₫). Never divide by 100.
 * - USD: integer represents cents (e.g. 1000 -> $10.00). Divided by 100.
 */
export function formatCurrency(amount: number, currency: string = CANONICAL_CURRENCY): string {
  const cleanCurrency = (currency || CANONICAL_CURRENCY).trim().toUpperCase();

  if (cleanCurrency === "VND") {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  }

  // USD / Cents-based currency fallback
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    amount / 100,
  );
}
