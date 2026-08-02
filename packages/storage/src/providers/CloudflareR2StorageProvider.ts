import { createHash, randomUUID } from "node:crypto";
import { extname } from "node:path";
import type {
  StorageProvider,
  UploadOptions,
  UploadResult,
  SignedUploadUrlResult,
} from "../contracts/StorageProvider";

export interface R2Config {
  readonly endpoint: string;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
  readonly bucket: string;
  readonly publicUrlBase: string;
}

export class CloudflareR2StorageProvider implements StorageProvider {
  private readonly config: R2Config;

  constructor(config: R2Config) {
    this.config = config;
  }

  async upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    const key = `${options.missionId}/${randomUUID()}${extname(options.fileName)}`;
    const url = `${this.config.endpoint}/${this.config.bucket}/${key}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": options.mimeType,
        Authorization: `AWS4-HMAC-SHA256 Credential=${this.config.accessKeyId}`,
      },
      body: buffer as unknown as BodyInit,
    });
    if (!response.ok) throw new Error(`R2 upload failed: ${response.status}`);
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
    const key = randomUUID();
    return {
      url: `${this.config.endpoint}/${this.config.bucket}/${key}`,
      fields: { key },
      storageKey: key,
    };
  }

  async getDownloadUrl(storageKey: string): Promise<string> {
    return `${this.config.publicUrlBase}/${encodeURIComponent(storageKey)}`;
  }

  async delete(storageKey: string): Promise<boolean> {
    const url = `${this.config.endpoint}/${this.config.bucket}/${storageKey}`;
    const response = await fetch(url, { method: "DELETE" });
    return response.ok;
  }

  async exists(storageKey: string): Promise<boolean> {
    const url = `${this.config.endpoint}/${this.config.bucket}/${storageKey}`;
    const response = await fetch(url, { method: "HEAD" });
    return response.ok;
  }
}
