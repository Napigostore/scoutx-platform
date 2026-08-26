import { NextResponse } from "next/server";
import { apiError } from "@/lib/error-mapper";
import { LocalStorageProvider, createStorageProvider } from "@scoutx/storage";
import { readFile } from "node:fs/promises";
import { join, extname, normalize } from "node:path";

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

function getMimeType(key: string): string {
  const ext = extname(key).toLowerCase();
  switch (ext) {
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".gif":
      return "image/gif";
    case ".svg":
      return "image/svg+xml";
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    case ".mov":
      return "video/quicktime";
    case ".ogg":
      return "video/ogg";
    default:
      return "application/octet-stream";
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawKey = searchParams.get("key");

  if (!rawKey) {
    return apiError("key query parameter required", 422);
  }

  // Prevent path traversal
  const cleanKey = normalize(rawKey.replace(/\\/g, "/"));
  if (cleanKey.includes("..") || cleanKey.startsWith("/") || cleanKey.startsWith("\\")) {
    return apiError("Invalid storage key", 400);
  }

  const isDownload =
    searchParams.get("download") === "true" || searchParams.get("disposition") === "attachment";
  const dispositionType = isDownload ? "attachment" : "inline";

  try {
    const downloadUrl = await storageProvider.getDownloadUrl(cleanKey);
    if (downloadUrl.startsWith("http://") || downloadUrl.startsWith("https://")) {
      return NextResponse.redirect(downloadUrl);
    }

    const filePath = join("./data/evidence", cleanKey);
    const buffer = await readFile(filePath);
    const customMime = searchParams.get("mimeType");
    const mimeType = customMime || getMimeType(cleanKey);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `${dispositionType}; filename="${encodeURIComponent(cleanKey)}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return apiError("File not found", 404);
  }
}
