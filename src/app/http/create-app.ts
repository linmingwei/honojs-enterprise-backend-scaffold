import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppConfig } from "@/shared/config/types";
import { registerModules } from "@/app/bootstrap/module-registry";
import { registerAuthModule } from "@/modules/auth";
import { registerStorageModule } from "@/modules/storage";
import { registerTenantModule } from "@/modules/tenant";
import { registerDocs } from "./docs";

export function createApp(config: AppConfig) {
  const app = new OpenAPIHono();

  app.get("/healthz", (c) => c.json({ ok: true }));
  registerDocs(app);

  registerModules(config, {
    auth: () => registerAuthModule(app, config),
    tenant: () => registerTenantModule(app, config),
    rbac: () => {},
    audit: () => {},
    storage: () => registerStorageModule(app, config),
    cache: () => {},
    queue: () => {},
    scheduler: () => {},
    payment: () => {},
    notify: () => {},
  });

  return app;
}
