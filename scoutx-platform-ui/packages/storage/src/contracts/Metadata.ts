export interface FileMetadata {
  readonly width: number | null;
  readonly height: number | null;
  readonly duration: number | null;
  readonly mimeType: string;
  readonly bytes: number;
  readonly sha256: string;
}

export interface MetadataExtractor {
  extract(filePath: string): Promise<FileMetadata>;
}
