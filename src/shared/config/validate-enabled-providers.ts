import { AppError } from "@/shared/errors/app-error";
import type { AppConfig } from "./types";

export function validateEnabledProviders(config: AppConfig) {
  if (config.features.storage.enabled && config.providers.storage === "r2") {
    if (!config.storage.r2.bucket || !config.storage.r2.endpoint) {
      throw new AppError("Missing R2 config", 500, "missing_r2_config");
    }
  }

  if (config.features.storage.enabled && config.providers.storage === "oss") {
    if (!config.storage.oss.region || !config.storage.oss.bucket) {
      throw new AppError("Missing OSS config", 500, "missing_oss_config");
    }
  }

  if ((config.features.queue.enabled || config.features.scheduler.enabled) && !config.redis.url) {
    throw new AppError("Missing Redis config", 500, "missing_redis_config");
  }
}
