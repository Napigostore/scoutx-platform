import type { StorageProvider } from "../contracts/StorageProvider";
import { LocalStorageProvider } from "../providers/LocalStorageProvider";
import {
  CloudflareR2StorageProvider,
  type R2Config,
} from "../providers/CloudflareR2StorageProvider";

export type StorageProviderType = "local" | "cloudflare-r2";

export function createStorageProvider(
  type: StorageProviderType,
  config?: R2Config,
): StorageProvider {
  switch (type) {
    case "local":
      return new LocalStorageProvider(config?.bucket ?? "./data/evidence");
    case "cloudflare-r2":
      if (!config) throw new Error("R2 config required for cloudflare-r2 provider");
      return new CloudflareR2StorageProvider(config);
    default:
      throw new Error(`Unknown storage provider type: ${type as string}`);
  }
}
