import { createHash, randomUUID } from "crypto";
import { writeFile, unlink, access, mkdir } from "node:fs/promises";
import { join, dirname, extname } from "node:path";
import type {
  StorageProvider,
  UploadOptions,
  UploadResult,
  SignedUploadUrlResult,
} from "../contracts/StorageProvider";

export class LocalStorageProvider implements StorageProvider {
  private readonly basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  async upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    const key = `${options.missionId}/${randomUUID()}${extname(options.fileName)}`;
    const filePath = join(this.basePath, key);
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, buffer);
    const sha256 = createHash("sha256").update(buffer).digest("hex");
    return {
      storageKey: key,
      sha256,
      mimeType: options.mimeType,
      bytes: buffer.length,
      width: null,
      height: null,
      duration: null,
    };
  }

  async getSignedUploadUrl(_fileName: string, _mimeType: string): Promise<SignedUploadUrlResult> {
    throw new Error("Signed URLs not supported in local mode");
  }

  async getDownloadUrl(storageKey: string): Promise<string> {
    return `/api/evidence/download?key=${encodeURIComponent(storageKey)}`;
  }

  async delete(storageKey: string): Promise<boolean> {
    try {
      await unlink(join(this.basePath, storageKey));
      return true;
    } catch {
      return false;
    }
  }

  async exists(storageKey: string): Promise<boolean> {
    try {
      await access(join(this.basePath, storageKey));
      return true;
    } catch {
      return false;
    }
  }
}
