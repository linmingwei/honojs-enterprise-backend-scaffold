import type { OpenAPIHono } from "@hono/zod-openapi";
import type { AppConfig } from "@/shared/config/types";
import { registerAuthRoutes } from "./http/routes";

export function registerAuthModule(app: OpenAPIHono, _config: AppConfig) {
  registerAuthRoutes(app);
}
