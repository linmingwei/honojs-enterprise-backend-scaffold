import type { QueueBus } from "@/infrastructure/queue/bullmq";

/**
 * Example: enqueue business work instead of doing slow logic inline in HTTP handlers.
 */

export async function requestCatalogRepricing(
  queueBus: QueueBus,
  input: {
    tenantId: string;
    productId: string;
    requestedBy: string;
  },
) {
  return queueBus.enqueue("catalog.reprice-product", {
    tenantId: input.tenantId,
    productId: input.productId,
    requestedBy: input.requestedBy,
    requestedAt: new Date().toISOString(),
  });
}

/**
 * Example: register recurring business work with the scheduler abstraction.
 */
export async function registerCatalogTaskSchedules(queueBus: QueueBus) {
  await queueBus.schedule(
    "catalog.sync-daily-rollup",
    {
      job: "catalog.sync-daily-rollup",
    },
    "0 3 * * *",
  );
}

/**
 * Example usage in an application service:
 *
 * await requestCatalogRepricing(queueBus, {
 *   tenantId,
 *   productId,
 *   requestedBy: principalId,
 * });
 */
