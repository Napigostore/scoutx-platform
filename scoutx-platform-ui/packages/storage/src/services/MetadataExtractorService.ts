import type { FileMetadata, MetadataExtractor } from "../contracts/Metadata";
import { createHash } from "node:crypto";

export class MetadataExtractorService implements MetadataExtractor {
  async extract(filePath: string): Promise<FileMetadata> {
    const { readFile } = await import("node:fs/promises");
    const buffer = await readFile(filePath);
    const sha256 = createHash("sha256").update(buffer).digest("hex");
    const bytes = buffer.length;
    const mimeType = await this.detectMimeType(buffer);
    const size = await this.detectDimensions(buffer, mimeType);
    return {
      width: size.width,
      height: size.height,
      duration: null,
      mimeType,
      bytes,
      sha256,
    };
  }

  private async detectMimeType(buffer: Buffer): Promise<string> {
    const header = buffer.subarray(0, 16).toString("hex");
    if (header.startsWith("89504e47")) return "image/png";
    if (header.startsWith("ffd8ffe0") || header.startsWith("ffd8ffe1")) return "image/jpeg";
    if (header.startsWith("52494646")) return "image/webp";
    if (header.startsWith("00000020")) return "video/mp4";
    return "application/octet-stream";
  }

  private async detectDimensions(
    _buffer: Buffer,
    _mimeType: string,
  ): Promise<{ width: number | null; height: number | null }> {
    return { width: null, height: null };
  }
}
