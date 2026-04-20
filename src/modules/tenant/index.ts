import type { OpenAPIHono } from "@hono/zod-openapi";
import type { AppConfig } from "@/shared/config/types";
import { createTenantRouteServices, registerTenantRoutes } from "./http/routes";

export function registerTenantModule(app: OpenAPIHono, config: AppConfig) {
  registerTenantRoutes(app, createTenantRouteServices(config));
}
