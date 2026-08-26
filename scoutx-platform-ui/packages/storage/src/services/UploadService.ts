import type { StorageProvider, UploadOptions } from "../contracts/StorageProvider";
import type { EventBus } from "@scoutx/events";
import { randomUUID } from "node:crypto";

export interface UploadServiceConfig {
  readonly storageProvider: StorageProvider;
  readonly eventBus: EventBus;
}

export class UploadService {
  private readonly config: UploadServiceConfig;

  constructor(config: UploadServiceConfig) {
    this.config = config;
  }

  async upload(
    buffer: Buffer,
    options: UploadOptions,
  ): Promise<{ evidenceId: string; storageKey: string }> {
    const evidenceId = randomUUID();
    const result = await this.config.storageProvider.upload(buffer, options);
    await this.config.eventBus.publish({
      type: "evidence.storage.processing.requested",
      payload: {
        evidenceId,
        storageKey: result.storageKey,
        fileName: options.fileName,
        mimeType: options.mimeType,
        bytes: options.bytes,
        filePath: result.storageKey,
        missionId: options.missionId,
        scoutId: options.scoutId,
      },
    });
    return { evidenceId, storageKey: result.storageKey };
  }

  async delete(storageKey: string): Promise<boolean> {
    const deleted = await this.config.storageProvider.delete(storageKey);
    if (deleted) {
      await this.config.eventBus.publish({
        type: "evidence.deleted",
        payload: { evidenceId: storageKey, storageKey },
      });
    }
    return deleted;
  }

  async getDownloadUrl(storageKey: string): Promise<string> {
    return this.config.storageProvider.getDownloadUrl(storageKey);
  }
}
