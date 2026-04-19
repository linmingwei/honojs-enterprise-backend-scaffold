import { Queue, Worker } from "bullmq";
import { createRedisClient } from "@/infrastructure/redis/client";

export type QueueBus = {
  enqueue: (name: string, data: unknown) => Promise<unknown>;
  schedule: (name: string, data: unknown, pattern: string) => Promise<unknown>;
};

export function createQueueBus(
  url = process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
): QueueBus {
  let queue: Queue | null = null;

  function getQueue() {
    if (queue) return queue;

    const connection = createRedisClient(url);
    queue = new Queue("default", { connection });
    return queue;
  }

  return {
    enqueue: (name, data) => getQueue().add(name, data),
    schedule: (name, data, pattern) =>
      getQueue().upsertJobScheduler(name, { pattern }, { name, data }),
  };
}

export function createQueueWorker(
  url = process.env.REDIS_URL ?? "redis://127.0.0.1:6379",
  queueName = "default",
) {
  const connection = createRedisClient(url);

  return new Worker(
    queueName,
    async (job) => {
      console.info("processing job", { name: job.name });
    },
    { connection },
  );
}
