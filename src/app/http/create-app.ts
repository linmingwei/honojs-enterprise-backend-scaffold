import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppConfig } from "@/shared/config/types";
import { registerModules } from "@/app/bootstrap/module-registry";
import { registerDocs } from "./docs";

export function createApp(config: AppConfig) {
  const app = new OpenAPIHono();

  app.get("/healthz", (c) => c.json({ ok: true }));
  registerDocs(app);

  registerModules(config, {
    auth: () => {},
    tenant: () => {},
    rbac: () => {},
    audit: () => {},
    storage: () => {},
    cache: () => {},
    queue: () => {},
    scheduler: () => {},
    payment: () => {},
    notify: () => {},
  });

  return app;
}
