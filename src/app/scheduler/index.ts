import { createQueueBus } from "@/infrastructure/queue/bullmq";

export async function startSchedulerBootstrap() {
  const queueBus = createQueueBus();
  await queueBus.schedule("heartbeat", { ok: true }, "*/5 * * * *");
  return queueBus;
}

if (import.meta.main) {
  await startSchedulerBootstrap();
}
