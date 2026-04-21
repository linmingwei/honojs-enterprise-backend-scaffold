import { Worker, type Job } from "bullmq";
import { createRedisClient } from "@/infrastructure/redis/client";
import {
  catalogTaskNames,
  type DailyRollupTask,
  type RebuildSearchIndexTask,
  type RepriceProductTask,
} from "./task-definitions.example";

async function handleRepriceProduct(job: Job<RepriceProductTask>) {
  console.info("reprice product", job.data);
}

async function handleRebuildSearchIndex(job: Job<RebuildSearchIndexTask>) {
  console.info("rebuild search index", job.data);
}

async function handleDailyRollup(job: Job<DailyRollupTask>) {
  console.info("daily rollup", job.data);
}

/**
 * Step 3: consume jobs in a dedicated worker process.
 * The current scaffold uses the default queue name; keep producer and consumer aligned.
 */
export function createCatalogTaskWorker() {
  const connection = createRedisClient();

  return new Worker(
    "default",
    async (job) => {
      switch (job.name) {
        case catalogTaskNames.repriceProduct:
          return handleRepriceProduct(job as Job<RepriceProductTask>);
        case catalogTaskNames.rebuildSearchIndex:
          return handleRebuildSearchIndex(job as Job<RebuildSearchIndexTask>);
        case catalogTaskNames.dailyRollup:
          return handleDailyRollup(job as Job<DailyRollupTask>);
        default:
          throw new Error(`Unknown job: ${job.name}`);
      }
    },
    { connection },
  );
}
