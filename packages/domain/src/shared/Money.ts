/** Monetary amount stored in the smallest currency unit (e.g. cents). */
export interface Money {
  readonly amountMinor: number;
  readonly currency: string;
}

const CURRENCY_CODE = /^[A-Z]{3}$/;

export function isValidMoney(money: Money): boolean {
  return (
    Number.isInteger(money.amountMinor) &&
    Number.isFinite(money.amountMinor) &&
    CURRENCY_CODE.test(money.currency)
  );
}

export function createMoney(amountMinor: number, currency: string): Money {
  const money: Money = {
    amountMinor,
    currency: currency.toUpperCase(),
  };

  if (!isValidMoney(money)) {
    throw new Error("Invalid Money value");
  }

  return money;
}

export function addMoney(left: Money, right: Money): Money {
  if (left.currency !== right.currency) {
    throw new Error(`Currency mismatch: ${left.currency} vs ${right.currency}`);
  }

  return createMoney(left.amountMinor + right.amountMinor, left.currency);
}

export function subtractMoney(left: Money, right: Money): Money {
  if (left.currency !== right.currency) {
    throw new Error(`Currency mismatch: ${left.currency} vs ${right.currency}`);
  }

  return createMoney(left.amountMinor - right.amountMinor, left.currency);
}

export function isPositiveMoney(money: Money): boolean {
  return money.amountMinor > 0;
}

export function isZeroMoney(money: Money): boolean {
  return money.amountMinor === 0;
}
