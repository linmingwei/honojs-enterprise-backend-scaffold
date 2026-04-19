import type { OpenAPIHono } from "@hono/zod-openapi";
import type { AppConfig } from "@/shared/config/types";
import type { QueueBus } from "@/infrastructure/queue/bullmq";

export type AppModule = {
  name: keyof AppConfig["features"];
  kind: "core" | "optional";
  registerHttp?: (app: OpenAPIHono, config: AppConfig) => void;
  registerWorker?: (config: AppConfig) => Promise<unknown> | unknown;
  registerScheduler?: (config: AppConfig, queueBus: QueueBus) => Promise<unknown> | unknown;
};
