/**
 * Coin/transaction domain types for the repository layer.
 */

export interface CoinTransactionRecord {
  id: string;
  userId: string;
  amountCents: number;
  currency: string;
  reason: string;
  description: string | null;
  eventType: string;
  missionId: string | null;
  createdAt: Date;
}

export interface CreateCoinTransactionInput {
  id: string;
  userId: string;
  amountCents: number;
  currency?: string;
  reason: string;
  description?: string | null;
  eventType: string;
  missionId?: string | null;
}

export interface CoinRepository {
  create(input: CreateCoinTransactionInput): Promise<CoinTransactionRecord>;
  findById(id: string): Promise<CoinTransactionRecord | null>;
  findByUserId(userId: string): Promise<readonly CoinTransactionRecord[]>;
  findByMissionId(missionId: string): Promise<readonly CoinTransactionRecord[]>;
  balanceByUserId(userId: string): Promise<number>;
  sumByMissionId(missionId: string): Promise<number>;
  countByUserId(userId: string): Promise<number>;
}
