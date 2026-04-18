import type { OpenAPIHono } from "@hono/zod-openapi";
import type { AppConfig } from "@/shared/config/types";
import { registerStorageRoutes } from "./http/routes";

export function registerStorageModule(app: OpenAPIHono, config: AppConfig) {
  registerStorageRoutes(app, config);
}
