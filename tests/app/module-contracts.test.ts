import { describe, expect, it } from "bun:test";
import { createApp } from "@/app/http/create-app";

describe("module contracts", () => {
  it("still mounts core auth routes even if the feature flag is false", async () => {
    const app = createApp({
      features: {
        auth: { enabled: false },
        tenant: { enabled: false },
        rbac: { enabled: false },
        audit: { enabled: false },
        storage: { enabled: false },
        cache: { enabled: false },
        queue: { enabled: false },
        scheduler: { enabled: false },
        payment: { enabled: false },
        notify: { enabled: false },
      },
      providers: { storage: "r2", cache: "redis", queue: "none" },
      auth: { baseUrl: "http://localhost:3000" },
      db: { url: "postgres://example" },
      redis: { url: "" },
      queue: { defaultQueueName: "default" },
      scheduler: { heartbeatCron: "*/5 * * * *" },
      payment: { provider: "none" },
      notify: { emailProvider: "none", smsProvider: "none" },
      storage: {
        r2: { bucket: "", endpoint: "" },
        oss: { region: "", bucket: "" },
      },
    });

    const openapiRes = await app.request("/openapi.json");
    expect(openapiRes.status).toBe(200);

    const spec = await openapiRes.json();
    expect(spec.paths["/api/admin/users"]).toBeDefined();
  });
});
