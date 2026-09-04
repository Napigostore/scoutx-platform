import crypto from "node:crypto";
import { prisma } from "./prisma";

export function hashApiKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export async function generateApiKey({
  userId,
  name,
  scopes = ["read", "write"],
  expiresInDays,
}: {
  userId: string;
  name: string;
  scopes?: string[];
  expiresInDays?: number;
}) {
  const randomBytes = crypto.randomBytes(24).toString("hex");
  const rawKey = `sk_live_${randomBytes}`;
  const keyPrefix = rawKey.substring(0, 12);
  const keyHash = hashApiKey(rawKey);

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null;

  const apiKey = await prisma.apiKey.create({
    data: {
      userId,
      name,
      keyPrefix,
      keyHash,
      scopes,
      expiresAt,
    },
  });

  return {
    id: apiKey.id,
    name: apiKey.name,
    keyPrefix: apiKey.keyPrefix,
    rawKey, // Only returned ONCE upon creation
    scopes: apiKey.scopes,
    expiresAt: apiKey.expiresAt,
    createdAt: apiKey.createdAt,
  };
}

export async function authenticateApiKey(request: Request) {
  const authHeader = request.headers.get("authorization");
  const apiKeyHeader = request.headers.get("x-api-key");

  let rawKey: string | null = null;

  if (apiKeyHeader) {
    rawKey = apiKeyHeader.trim();
  } else if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    rawKey = authHeader.substring(7).trim();
  }

  if (!rawKey || !rawKey.startsWith("sk_live_")) {
    return null;
  }

  const keyHash = hashApiKey(rawKey);

  const keyRecord = await prisma.apiKey.findUnique({
    where: { keyHash },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!keyRecord || keyRecord.revoked) {
    return null;
  }

  if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
    return null;
  }

  // Fire and forget updating lastUsedAt
  prisma.apiKey
    .update({
      where: { id: keyRecord.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {
      // Ignore background update errors
    });

  return {
    apiKeyId: keyRecord.id,
    userId: keyRecord.userId,
    user: keyRecord.user,
    scopes: keyRecord.scopes,
  };
}
