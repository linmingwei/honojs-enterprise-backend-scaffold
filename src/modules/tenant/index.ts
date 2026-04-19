import type { OpenAPIHono } from "@hono/zod-openapi";
import type { AppConfig } from "@/shared/config/types";
import { registerTenantRoutes } from "./http/routes";

export function registerTenantModule(app: OpenAPIHono, _config: AppConfig) {
  registerTenantRoutes(app);
}
