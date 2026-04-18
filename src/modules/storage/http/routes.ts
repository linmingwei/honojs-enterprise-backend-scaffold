import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { AppConfig } from "@/shared/config/types";
import { createObjectStorage } from "../domain/object-storage";

const createSignedUploadRoute = createRoute({
  method: "post",
  path: "/api/admin/storage/sign-upload",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            key: z.string().min(1),
            contentType: z.string().min(1),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Signed upload URL",
      content: {
        "application/json": {
          schema: z.object({
            url: z.string().url(),
            provider: z.enum(["r2", "oss"]),
          }),
        },
      },
    },
  },
});

export function registerStorageRoutes(app: OpenAPIHono, config: AppConfig) {
  app.openapi(createSignedUploadRoute, async (c) => {
    const body = c.req.valid("json");
    const storage = createObjectStorage({ provider: config.providers.storage });
    const result = await storage.signUpload(body);

    return c.json({
      url: result.url,
      provider: storage.providerName,
    });
  });
}
