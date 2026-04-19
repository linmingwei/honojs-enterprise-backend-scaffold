import { describe, expect, it } from "bun:test";
import { createApp } from "@/app/http/create-app";

describe("OpenAPI exposure", () => {
  it("serves docs and excludes disabled modules", async () => {
    const app = createApp({
      features: {
        auth: { enabled: true },
        tenant: { enabled: true },
        rbac: { enabled: true },
        audit: { enabled: true },
        storage: { enabled: false },
        cache: { enabled: false },
        queue: { enabled: false },
        scheduler: { enabled: false },
        payment: { enabled: false },
        notify: { enabled: false },
      },
      providers: { storage: "r2", cache: "redis", queue: "bullmq" },
      auth: { baseUrl: "http://localhost:3000" },
      storage: {
        r2: { bucket: "", endpoint: "" },
        oss: { region: "", bucket: "" },
      },
    });

    const res = await app.request("/docs");
    expect(res.status).toBe(200);

    const openapiRes = await app.request("/openapi.json");
    expect(openapiRes.status).toBe(200);

    const spec = await openapiRes.json();
    expect(spec.paths["/api/admin/users"]).toBeDefined();
    expect(spec.paths["/api/admin/users"].get).toBeDefined();
    expect(spec.paths["/api/admin/users"].post).toBeDefined();
    expect(spec.paths["/api/admin/storage/sign-upload"]).toBeUndefined();
  });
});
