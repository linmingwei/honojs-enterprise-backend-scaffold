import { registerAuthModule } from "@/modules/auth";
import type { AppModule } from "@/modules/core/module";
import { registerStorageModule } from "@/modules/storage";
import { registerTenantModule } from "@/modules/tenant";
import { createQueueWorker } from "@/infrastructure/queue/bullmq";

export const appModules: AppModule[] = [
  {
    name: "auth",
    kind: "core",
    registerHttp: registerAuthModule,
  },
  {
    name: "tenant",
    kind: "core",
    registerHttp: registerTenantModule,
  },
  {
    name: "rbac",
    kind: "core",
  },
  {
    name: "audit",
    kind: "core",
  },
  {
    name: "storage",
    kind: "optional",
    registerHttp: registerStorageModule,
  },
  {
    name: "cache",
    kind: "optional",
  },
  {
    name: "queue",
    kind: "optional",
    registerWorker: (config) => createQueueWorker(config.redis.url, config.queue.defaultQueueName),
  },
  {
    name: "scheduler",
    kind: "optional",
    registerScheduler: (config, queueBus) =>
      queueBus.schedule("heartbeat", { ok: true }, config.scheduler.heartbeatCron),
  },
  {
    name: "payment",
    kind: "optional",
  },
  {
    name: "notify",
    kind: "optional",
  },
];
