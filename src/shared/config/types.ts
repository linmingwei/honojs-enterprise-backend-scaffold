import { z } from "zod";

export const featureSchema = z.object({
  enabled: z.boolean(),
});

export const appConfigSchema = z.object({
  features: z.object({
    auth: featureSchema,
    tenant: featureSchema,
    rbac: featureSchema,
    audit: featureSchema,
    storage: featureSchema,
    cache: featureSchema,
    queue: featureSchema,
    scheduler: featureSchema,
    payment: featureSchema,
    notify: featureSchema,
  }),
  providers: z.object({
    storage: z.enum(["r2", "oss"]),
    cache: z.enum(["redis", "memory"]),
    queue: z.enum(["bullmq", "none"]),
  }),
  auth: z.object({
    baseUrl: z.string().url(),
  }),
  storage: z.object({
    r2: z.object({
      bucket: z.string(),
      endpoint: z.string(),
    }),
    oss: z.object({
      region: z.string(),
      bucket: z.string(),
    }),
  }),
});

export type AppConfig = z.infer<typeof appConfigSchema>;
