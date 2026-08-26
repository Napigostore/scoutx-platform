export interface EvidenceUploadStartedEvent {
  readonly type: "evidence.upload.started";
  readonly payload: {
    readonly evidenceId: string;
    readonly fileName: string;
    readonly mimeType: string;
    readonly bytes: number;
    readonly missionId: string;
    readonly scoutId: string;
  };
}

export interface EvidenceUploadCompletedEvent {
  readonly type: "evidence.upload.completed";
  readonly payload: {
    readonly evidenceId: string;
    readonly storageKey: string;
    readonly sha256: string;
    readonly mimeType: string;
    readonly bytes: number;
    readonly width: number | null;
    readonly height: number | null;
    readonly duration: number | null;
  };
}

export interface EvidenceUploadFailedEvent {
  readonly type: "evidence.upload.failed";
  readonly payload: {
    readonly evidenceId: string;
    readonly reason: string;
  };
}

export interface EvidenceDeletedEvent {
  readonly type: "evidence.deleted";
  readonly payload: {
    readonly evidenceId: string;
    readonly storageKey: string;
  };
}

export interface StorageProcessingRequestedEvent {
  readonly type: "evidence.storage.processing.requested";
  readonly payload: {
    readonly evidenceId: string;
    readonly storageKey: string;
    readonly fileName: string;
    readonly mimeType: string;
    readonly bytes: number;
    readonly filePath: string;
    readonly missionId: string;
    readonly scoutId: string;
  };
}

export type StorageDomainEvent =
  | EvidenceUploadStartedEvent
  | EvidenceUploadCompletedEvent
  | EvidenceUploadFailedEvent
  | EvidenceDeletedEvent
  | StorageProcessingRequestedEvent;
