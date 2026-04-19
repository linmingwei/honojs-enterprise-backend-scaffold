import { describe, expect, it } from "bun:test";
import { createApp } from "@/app/http/create-app";

describe("feature flags", () => {
  it("boots with payment and notify disabled", async () => {
    const app = createApp({
      features: {
        auth: { enabled: true },
        tenant: { enabled: true },
        rbac: { enabled: true },
        audit: { enabled: true },
        storage: { enabled: true },
        cache: { enabled: true },
        queue: { enabled: true },
        scheduler: { enabled: true },
        payment: { enabled: false },
        notify: { enabled: false },
      },
      providers: { storage: "r2", cache: "redis", queue: "bullmq" },
      auth: { baseUrl: "http://localhost:3000" },
      db: { url: "postgres://example" },
      redis: { url: "redis://127.0.0.1:6379" },
      queue: { defaultQueueName: "default" },
      scheduler: { heartbeatCron: "*/5 * * * *" },
      payment: { provider: "none" },
      notify: { emailProvider: "none", smsProvider: "none" },
      storage: {
        r2: { bucket: "", endpoint: "" },
        oss: { region: "", bucket: "" },
      },
    });

    const res = await app.request("/healthz");
    expect(res.status).toBe(200);
  });
});
