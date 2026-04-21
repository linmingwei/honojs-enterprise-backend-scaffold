import type { QueueBus } from "@/infrastructure/queue/bullmq";

/**
 * Example: business code should talk to the queue abstraction,
 * not directly to BullMQ classes inside application services.
 */

export async function enqueueCatalogReindex(
  queueBus: QueueBus,
  input: {
    tenantId: string;
    triggeredBy: string;
    productId: string;
  },
) {
  return queueBus.enqueue("catalog.reindex-product", {
    tenantId: input.tenantId,
    triggeredBy: input.triggeredBy,
    productId: input.productId,
  });
}

export async function enqueueLowStockAlert(
  queueBus: QueueBus,
  input: {
    tenantId: string;
    sku: string;
    remaining: number;
  },
) {
  return queueBus.enqueue("catalog.low-stock-alert", input);
}

export async function registerCatalogSchedulers(queueBus: QueueBus) {
  await queueBus.schedule(
    "catalog.daily-rollup",
    {
      job: "catalog.daily-rollup",
    },
    "0 2 * * *",
  );
}
