import { describe, expect, it } from "bun:test";
import { createApp } from "@/app/http/create-app";

describe("app boot", () => {
  it("returns 200 from /healthz and does not require optional providers to boot", async () => {
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
      providers: {
        storage: "r2",
        cache: "redis",
        queue: "bullmq",
      },
      auth: { baseUrl: "http://localhost:3000" },
      storage: {
        r2: { bucket: "", endpoint: "" },
        oss: { region: "", bucket: "" },
      },
    });

    const res = await app.request("/healthz");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
