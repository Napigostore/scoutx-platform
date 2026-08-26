import { describe, it, expect } from "vitest";
import { LocalStorageProvider } from "../src/providers/LocalStorageProvider";
import { createStorageProvider } from "../src/factory/StorageFactory";
import { MetadataExtractorService } from "../src/services/MetadataExtractorService";

describe("StorageProvider", () => {
  it("should create local provider", () => {
    const provider = createStorageProvider("local");
    expect(provider).toBeDefined();
  });

  it("should create local provider with explicit path", () => {
    const provider = new LocalStorageProvider("./test-data");
    expect(provider).toBeDefined();
  });

  it("should fail to create r2 provider without config", () => {
    expect(() => createStorageProvider("cloudflare-r2")).toThrow("R2 config required");
  });

  it("should create r2 provider with config", () => {
    const provider = createStorageProvider("cloudflare-r2", {
      endpoint: "https://r2.example.com",
      accessKeyId: "key",
      secretAccessKey: "secret",
      bucket: "test",
      publicUrlBase: "https://cdn.example.com",
    });
    expect(provider).toBeDefined();
  });

  it("should upload and delete a file", async () => {
    const provider = new LocalStorageProvider("./test-data");
    const buffer = Buffer.from("test content");
    const result = await provider.upload(buffer, {
      fileName: "test.txt",
      mimeType: "text/plain",
      bytes: buffer.length,
      missionId: "mission-1",
      scoutId: "scout-1",
    });
    expect(result.storageKey).toBeDefined();
    expect(result.sha256).toBeDefined();
    expect(result.mimeType).toBe("text/plain");
    expect(result.bytes).toBe(12);

    const exists = await provider.exists(result.storageKey);
    expect(exists).toBe(true);

    const deleted = await provider.delete(result.storageKey);
    expect(deleted).toBe(true);

    const existsAfter = await provider.exists(result.storageKey);
    expect(existsAfter).toBe(false);
  });
});

describe("MetadataExtractorService", () => {
  it("should detect mime type from buffer", async () => {
    const extractor = new MetadataExtractorService();
    const { writeFile, unlink } = await import("node:fs/promises");
    const tmpPath = "./test-tmp-img.webp";
    const webpHeader = Buffer.from([0x52, 0x49, 0x46, 0x46]);
    await writeFile(tmpPath, webpHeader);
    const result = await extractor.extract(tmpPath);
    expect(result.mimeType).toBe("image/webp");
    expect(result.sha256).toBeDefined();
    await unlink(tmpPath);
  });

  it("should detect mime type from magic bytes", async () => {
    const extractor = new MetadataExtractorService();
    // test via extract with a temp file
    const { writeFile, unlink } = await import("node:fs/promises");
    const tmpPath = "./test-tmp.png";
    const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    await writeFile(tmpPath, pngHeader);
    const result = await extractor.extract(tmpPath);
    expect(result.mimeType).toBe("image/png");
    expect(result.sha256).toBeDefined();
    await unlink(tmpPath);
  });
});
