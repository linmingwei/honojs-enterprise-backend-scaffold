import { describe, expect, it } from "bun:test";
import { createQueueBus } from "@/infrastructure/queue/bullmq";

describe("queue bus", () => {
  it("exposes enqueue and schedule operations", () => {
    const queueBus = createQueueBus("redis://127.0.0.1:6379");
    expect(typeof queueBus.enqueue).toBe("function");
    expect(typeof queueBus.schedule).toBe("function");
  });
});
