/** Domain timestamp represented as an immutable UTC Date. */
export type Timestamp = Readonly<Date>;

export function createTimestamp(value: Date | string | number = Date.now()): Timestamp {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid Timestamp value");
  }

  return date;
}

export function timestampToIso(timestamp: Timestamp): string {
  return timestamp.toISOString();
}

export function isTimestampBefore(left: Timestamp, right: Timestamp): boolean {
  return left.getTime() < right.getTime();
}

export function isTimestampAfter(left: Timestamp, right: Timestamp): boolean {
  return left.getTime() > right.getTime();
}

export function compareTimestamps(left: Timestamp, right: Timestamp): number {
  return left.getTime() - right.getTime();
}
