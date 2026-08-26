export interface ThumbnailGenerator {
  generate(buffer: Buffer, mimeType: string): Promise<Buffer | null>;
}
