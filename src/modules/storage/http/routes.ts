import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { AppConfig } from "@/shared/config/types";
import { createObjectStorage } from "../domain/object-storage";
import { recordFileMetadata } from "../application/file-records";

type RecordFileInput = {
  tenantId?: string;
  uploaderUserId?: string;
  provider: "r2" | "oss";
  bucket: string;
  objectKey: string;
  mimeType: string;
  size: number;
};

export type StorageRouteServices = {
  signUpload: (input: { key: string; contentType: string }) => Promise<{ url: string }>;
  recordFile: (input: RecordFileInput) => Promise<{ id: string }>;
};

function resolveStorageBucket(config: AppConfig) {
  return config.providers.storage === "r2" ? config.storage.r2.bucket : config.storage.oss.bucket;
}

function createStorageRouteServices(config: AppConfig): StorageRouteServices {
  const storage = createObjectStorage({
    provider: config.providers.storage,
    r2: {
      bucket: config.storage.r2.bucket,
      endpoint: config.storage.r2.endpoint,
    },
    oss: {
      region: config.storage.oss.region,
      bucket: config.storage.oss.bucket,
    },
  });

  return {
    signUpload: (input) => storage.signUpload(input),
    recordFile: recordFileMetadata,
  };
}

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
            size: z.number().int().nonnegative(),
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
            id: z.string(),
            url: z.string().url(),
            provider: z.enum(["r2", "oss"]),
          }),
        },
      },
    },
  },
});

export function registerStorageRoutes(
  app: OpenAPIHono,
  config: AppConfig,
  services: StorageRouteServices = createStorageRouteServices(config),
) {
  app.openapi(createSignedUploadRoute, async (c) => {
    const body = c.req.valid("json");
    const result = await services.signUpload({
      key: body.key,
      contentType: body.contentType,
    });
    const file = await services.recordFile({
      tenantId: c.req.header("x-tenant-id") ?? undefined,
      uploaderUserId: c.req.header("x-principal-id") ?? undefined,
      provider: config.providers.storage,
      bucket: resolveStorageBucket(config),
      objectKey: body.key,
      mimeType: body.contentType,
      size: body.size,
    });

    return c.json({
      id: file.id,
      url: result.url,
      provider: config.providers.storage,
    });
  });
}
