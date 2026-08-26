export interface UploadOptions {
  readonly fileName: string;
  readonly mimeType: string;
  readonly bytes: number;
  readonly missionId: string;
  readonly scoutId: string;
}

export interface UploadResult {
  readonly storageKey: string;
  readonly sha256: string;
  readonly mimeType: string;
  readonly bytes: number;
  readonly width: number | null;
  readonly height: number | null;
  readonly duration: number | null;
}

export interface SignedUploadUrlResult {
  readonly url: string;
  readonly fields: Record<string, string>;
  readonly storageKey: string;
}

export interface StorageProvider {
  upload(buffer: Buffer, options: UploadOptions): Promise<UploadResult>;
  getSignedUploadUrl(fileName: string, mimeType: string): Promise<SignedUploadUrlResult>;
  getDownloadUrl(storageKey: string): Promise<string>;
  delete(storageKey: string): Promise<boolean>;
  exists(storageKey: string): Promise<boolean>;
}
