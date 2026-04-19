import { describe, expect, it } from "bun:test";
import { validateEnabledProviders } from "@/shared/config/validate-enabled-providers";

describe("validateEnabledProviders", () => {
  it("does not require storage secrets when storage is disabled", () => {
    expect(() =>
      validateEnabledProviders({
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
      }),
    ).not.toThrow();
  });
});
