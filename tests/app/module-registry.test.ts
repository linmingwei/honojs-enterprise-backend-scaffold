import { describe, expect, it } from "bun:test";
import { registerModules } from "@/app/bootstrap/module-registry";
import type { AppConfig } from "@/shared/config/types";

describe("module registry", () => {
  it("skips disabled modules entirely", () => {
    const calls: string[] = [];
    const config = {
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
    } satisfies AppConfig;

    registerModules(config, {
      auth: () => calls.push("auth"),
      storage: () => calls.push("storage"),
    });

    expect(calls).toEqual(["auth"]);
  });
});
