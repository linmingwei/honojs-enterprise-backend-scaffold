import type { OssStorageConfig } from "../infrastructure/oss-storage";
import type { R2StorageConfig } from "../infrastructure/r2-storage";
import { createOssStorage } from "../infrastructure/oss-storage";
import { createR2Storage } from "../infrastructure/r2-storage";

export type ObjectStorage = {
  providerName: "r2" | "oss";
  put: (input: { key: string; body: ArrayBuffer; contentType: string }) => Promise<void>;
  get: (key: string) => Promise<unknown>;
  delete: (key: string) => Promise<void>;
  signUpload: (input: { key: string; contentType: string }) => Promise<{ url: string }>;
  signDownload: (key: string) => Promise<{ url: string }>;
};

export function createObjectStorage(input: {
  provider: "r2" | "oss";
  r2?: R2StorageConfig;
  oss?: OssStorageConfig;
}): ObjectStorage {
  return input.provider === "oss" ? createOssStorage(input.oss) : createR2Storage(input.r2);
}
