import { readFileSync } from "node:fs";
import { parse as parseToml } from "smol-toml";
import { appConfigSchema, type AppConfig } from "./types";

export function loadConfig(path = "config/app.toml"): AppConfig {
  const raw = parseToml(readFileSync(path, "utf-8")) as Record<string, any>;

  raw.db ??= {};
  raw.redis ??= {};
  raw.queue ??= {};
  raw.scheduler ??= {};
  raw.payment ??= {};
  raw.notify ??= {};
  raw.storage ??= {};
  raw.storage.r2 ??= {};
  raw.storage.oss ??= {};

  raw.db.url = process.env.DATABASE_URL ?? raw.db.url ?? "";
  raw.redis.url = process.env.REDIS_URL ?? raw.redis.url ?? "";
  raw.queue.defaultQueueName = raw.queue.defaultQueueName ?? "default";
  raw.scheduler.heartbeatCron = raw.scheduler.heartbeatCron ?? "*/5 * * * *";
  raw.payment.provider = raw.payment.provider ?? "none";
  raw.notify.emailProvider = raw.notify.emailProvider ?? "none";
  raw.notify.smsProvider = raw.notify.smsProvider ?? "none";
  raw.storage.r2.bucket = process.env.R2_BUCKET ?? raw.storage.r2.bucket ?? "";
  raw.storage.r2.endpoint = process.env.R2_ENDPOINT ?? raw.storage.r2.endpoint ?? "";
  raw.storage.oss.region = process.env.OSS_REGION ?? raw.storage.oss.region ?? "";
  raw.storage.oss.bucket = process.env.OSS_BUCKET ?? raw.storage.oss.bucket ?? "";

  return appConfigSchema.parse(raw);
}
