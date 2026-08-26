import { readFile } from "node:fs/promises";
import type { EventBus, DomainEvent } from "@scoutx/events";
import type { StorageProvider } from "../contracts/StorageProvider";
import type { MetadataExtractor } from "../contracts/Metadata";
import type { VirusScanner } from "../contracts/VirusScan";
import type { ThumbnailGenerator } from "../contracts/Thumbnail";
import type { UploadOptions } from "../contracts/StorageProvider";

export interface UploadBackgroundProcessorConfig {
  readonly storageProvider: StorageProvider;
  readonly metadataExtractor: MetadataExtractor;
  readonly eventBus: EventBus;
  readonly virusScanner?: VirusScanner;
  readonly thumbnailGenerator?: ThumbnailGenerator;
}

export class UploadBackgroundProcessor {
  private readonly config: UploadBackgroundProcessorConfig;

  constructor(config: UploadBackgroundProcessorConfig) {
    this.config = config;
  }

  subscribe(): void {
    this.config.eventBus.subscribe(
      "evidence.storage.processing.requested",
      (event: DomainEvent) => {
        if (event.type === "evidence.storage.processing.requested") {
          void this.process(event);
        }
      },
    );
  }

  private async process(
    event: DomainEvent & { type: "evidence.storage.processing.requested" },
  ): Promise<void> {
    const {
      evidenceId,
      storageKey,
      fileName,
      mimeType,
      bytes: _bytes,
      filePath,
      missionId,
      scoutId,
    } = event.payload;

    try {
      if (this.config.virusScanner) {
        const fileBuffer = await readFile(filePath);
        const scanResult = await this.config.virusScanner.scan(fileBuffer, fileName);
        if (scanResult.infected) {
          await this.config.storageProvider.delete(storageKey);
          await this.config.eventBus.publish({
            type: "evidence.upload.failed",
            payload: { evidenceId, reason: "Virus detected" },
          });
          return;
        }
      }

      const fileBuffer = await readFile(filePath);
      const metadata = await this.config.metadataExtractor.extract(filePath);

      if (this.config.thumbnailGenerator) {
        const thumbnail = await this.config.thumbnailGenerator.generate(fileBuffer, mimeType);
        if (thumbnail) {
          await this.config.storageProvider.upload(thumbnail, {
            fileName: "thumb_" + fileName,
            mimeType,
            bytes: thumbnail.length,
            missionId,
            scoutId,
          } as UploadOptions);
        }
      }

      await this.config.eventBus.publish({
        type: "evidence.upload.completed",
        payload: {
          evidenceId,
          storageKey,
          sha256: metadata.sha256,
          mimeType,
          bytes: metadata.bytes,
          width: metadata.width,
          height: metadata.height,
          duration: metadata.duration,
        },
      });
    } catch (err) {
      await this.config.eventBus.publish({
        type: "evidence.upload.failed",
        payload: { evidenceId, reason: err instanceof Error ? err.message : "Processing failed" },
      });
    }
  }
}
