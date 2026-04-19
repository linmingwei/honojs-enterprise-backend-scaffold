import { OpenAPIHono } from "@hono/zod-openapi";
import { appModules } from "@/app/bootstrap/app-modules";
import { getEnabledModules } from "@/app/bootstrap/module-registry";
import type { AppConfig } from "@/shared/config/types";
import { validateEnabledProviders } from "@/shared/config/validate-enabled-providers";
import { registerDocs } from "./docs";

export function createApp(config: AppConfig) {
  validateEnabledProviders(config);

  const app = new OpenAPIHono();

  app.get("/healthz", (c) => c.json({ ok: true }));
  registerDocs(app);

  for (const module of getEnabledModules(config, appModules)) {
    module.registerHttp?.(app, config);
  }

  return app;
}
