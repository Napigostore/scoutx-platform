import { NextResponse } from "next/server";
import { authenticate } from "@/lib/auth-helpers";
import { apiError } from "@/lib/error-mapper";
import { LocalStorageProvider, createStorageProvider } from "@scoutx/storage";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

function getStorageProvider() {
  if (process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY && process.env.R2_BUCKET) {
    return createStorageProvider("cloudflare-r2", {
      accountId: process.env.R2_ACCOUNT_ID,
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      bucket: process.env.R2_BUCKET,
      publicUrlBase: process.env.R2_PUBLIC_URL_BASE,
    });
  }
  return new LocalStorageProvider("./data/evidence");
}

const storageProvider = getStorageProvider();

export async function GET(request: Request) {
  const principal = await authenticate(request);
  if (!principal) {
    return apiError("Unauthorized", 401);
  }

  const { searchParams } = new URL(request.url);
  const storageKey = searchParams.get("key");

  if (!storageKey) {
    return apiError("key query parameter required", 422);
  }

  try {
    const downloadUrl = await storageProvider.getDownloadUrl(storageKey);
    if (downloadUrl.startsWith("http://") || downloadUrl.startsWith("https://")) {
      return NextResponse.redirect(downloadUrl);
    }

    const buffer = await readFile(join("./data/evidence", storageKey));
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(storageKey)}"`,
      },
    });
  } catch {
    return apiError("File not found", 404);
  }
}
