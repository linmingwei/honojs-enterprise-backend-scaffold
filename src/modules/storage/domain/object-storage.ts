import { createOssStorage } from "../infrastructure/oss-storage";
import { createR2Storage } from "../infrastructure/r2-storage";

export type ObjectStorage = {
  providerName: "r2" | "oss";
  put: (input: { key: string; body: ArrayBuffer; contentType: string }) => Promise<void>;
  signUpload: (input: { key: string; contentType: string }) => Promise<{ url: string }>;
};

export function createObjectStorage(input: { provider: "r2" | "oss" }): ObjectStorage {
  return input.provider === "oss" ? createOssStorage() : createR2Storage();
}
