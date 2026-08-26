import crypto from "node:crypto";

const getSecret = () =>
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  process.env.JWT_SECRET ??
  "fiwokan-reference-attachment-secret-key-32-chars-min!";

export interface AttachmentTokenPayload {
  id: string;
  userId: string;
  storageKey: string;
  url: string;
  fileName: string;
  mimeType: string;
  createdAt: number;
  exp: number;
}

export function createAttachmentToken(data: Omit<AttachmentTokenPayload, "exp">): string {
  const payload: AttachmentTokenPayload = {
    ...data,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours validity
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto.createHmac("sha256", getSecret()).update(payloadB64).digest("hex");

  return `${payloadB64}.${signature}`;
}

export function verifyAttachmentToken(token: string): AttachmentTokenPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadB64, signature] = parts;
    if (!payloadB64 || !signature) return null;

    const expectedSignature = crypto
      .createHmac("sha256", getSecret())
      .update(payloadB64)
      .digest("hex");

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);

    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const payloadStr = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload = JSON.parse(payloadStr) as AttachmentTokenPayload;

    if (payload.exp < Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
