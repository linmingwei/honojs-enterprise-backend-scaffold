import { describe, expect, it } from "bun:test";
import { OpenAPIHono } from "@hono/zod-openapi";
import { registerStorageRoutes } from "@/modules/storage/http/routes";

describe("storage routes", () => {
  it("persists file metadata when generating a signed upload URL", async () => {
    const app = new OpenAPIHono();
    let recordedInput:
      | {
          tenantId?: string;
          uploaderUserId?: string;
          provider: "r2" | "oss";
          bucket: string;
          objectKey: string;
          mimeType: string;
          size: number;
        }
      | undefined;

    registerStorageRoutes(
      app,
      {
        providers: { storage: "r2", cache: "redis", queue: "none" },
        features: {
          auth: { enabled: true },
          tenant: { enabled: true },
          rbac: { enabled: true },
          audit: { enabled: true },
          storage: { enabled: true },
          cache: { enabled: false },
          queue: { enabled: false },
          scheduler: { enabled: false },
          payment: { enabled: false },
          notify: { enabled: false },
        },
        auth: { baseUrl: "http://localhost:3000" },
        db: { url: "postgres://example" },
        redis: { url: "" },
        queue: { defaultQueueName: "default" },
        scheduler: { heartbeatCron: "*/5 * * * *" },
        payment: { provider: "none" },
        notify: { emailProvider: "none", smsProvider: "none" },
        storage: {
          r2: { bucket: "files", endpoint: "https://r2.example.com" },
          oss: { region: "", bucket: "" },
        },
      },
      {
        signUpload: async () => ({ url: "https://signed.example.com" }),
        recordFile: async (input) => {
          recordedInput = input;
          return { id: "file-1" };
        },
      },
    );

    const res = await app.request("/api/admin/storage/sign-upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        key: "tenant-1/report.pdf",
        contentType: "application/pdf",
        size: 128,
      }),
    });

    expect(res.status).toBe(200);
    expect(recordedInput?.objectKey).toBe("tenant-1/report.pdf");
  });
});
