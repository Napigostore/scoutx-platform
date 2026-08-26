import { createHash, randomUUID } from "crypto";
import { extname } from "node:path";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type {
  StorageProvider,
  UploadOptions,
  UploadResult,
  SignedUploadUrlResult,
} from "../contracts/StorageProvider";

export interface R2Config {
  readonly endpoint?: string;
  readonly accountId?: string;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
  readonly bucket: string;
  readonly publicUrlBase?: string;
}

export class CloudflareR2StorageProvider implements StorageProvider {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly publicUrlBase?: string;

  constructor(config: R2Config) {
    const endpoint =
      config.endpoint ||
      (config.accountId ? `https://${config.accountId}.r2.cloudflarestorage.com` : "");
    if (!endpoint) {
      throw new Error("R2 endpoint or accountId is required for CloudflareR2StorageProvider");
    }

    this.bucket = config.bucket;
    this.publicUrlBase = config.publicUrlBase;

    this.client = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  async upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    const ext = extname(options.fileName);
    const key = `${options.missionId}/${randomUUID()}${ext}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: options.mimeType,
      }),
    );

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

  async getSignedUploadUrl(fileName: string, mimeType: string): Promise<SignedUploadUrlResult> {
    const ext = extname(fileName);
    const key = `${randomUUID()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
    });

    const url = await getSignedUrl(this.client, command, { expiresIn: 3600 });

    return {
      url,
      fields: { key },
      storageKey: key,
    };
  }

  async getDownloadUrl(storageKey: string): Promise<string> {
    if (this.publicUrlBase) {
      return `${this.publicUrlBase}/${encodeURIComponent(storageKey)}`;
    }

    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
    });

    return getSignedUrl(this.client, command, { expiresIn: 3600 });
  }

  async delete(storageKey: string): Promise<boolean> {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: storageKey,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }

  async exists(storageKey: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: storageKey,
        }),
      );
      return true;
    } catch {
      return false;
    }
  }
}
