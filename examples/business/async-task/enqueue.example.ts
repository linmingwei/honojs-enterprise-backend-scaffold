import type { QueueBus } from "@/infrastructure/queue/bullmq";
import {
  catalogTaskNames,
  type RebuildSearchIndexTask,
  type RepriceProductTask,
} from "./task-definitions.example";

/**
 * Step 2: enqueue from application services.
 * HTTP handlers should usually call these services, not QueueBus directly.
 */

export async function requestProductRepricing(
  queueBus: QueueBus,
  payload: RepriceProductTask,
) {
  return queueBus.enqueue(catalogTaskNames.repriceProduct, payload);
}

export async function requestSearchIndexRebuild(
  queueBus: QueueBus,
  payload: RebuildSearchIndexTask,
) {
  return queueBus.enqueue(catalogTaskNames.rebuildSearchIndex, payload);
}
