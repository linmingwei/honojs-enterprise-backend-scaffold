import { Worker } from "bullmq";
import { createRedisClient } from "@/infrastructure/redis/client";

export function startWorker() {
  const connection = createRedisClient();

  return new Worker(
    "default",
    async (job) => {
      console.info("processing job", { name: job.name });
    },
    { connection },
  );
}

if (import.meta.main) {
  startWorker();
}
