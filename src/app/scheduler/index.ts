import { appModules } from "@/app/bootstrap/app-modules";
import { getEnabledModules } from "@/app/bootstrap/module-registry";
import { createQueueBus } from "@/infrastructure/queue/bullmq";
import { loadConfig } from "@/shared/config/load-config";

export async function startSchedulerBootstrap() {
  const config = loadConfig();
  const queueBus = createQueueBus(config.redis.url || undefined);

  for (const module of getEnabledModules(config, appModules)) {
    await module.registerScheduler?.(config, queueBus);
  }

  return queueBus;
}

if (import.meta.main) {
  await startSchedulerBootstrap();
}
