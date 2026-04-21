import type { QueueBus } from "@/infrastructure/queue/bullmq";
import { catalogTaskNames } from "./task-definitions.example";

/**
 * Step 4: register recurring jobs through the scheduler abstraction.
 */
export async function registerCatalogTaskSchedules(queueBus: QueueBus) {
  await queueBus.schedule(
    catalogTaskNames.dailyRollup,
    {
      date: new Date().toISOString().slice(0, 10),
    },
    "0 3 * * *",
  );
}
