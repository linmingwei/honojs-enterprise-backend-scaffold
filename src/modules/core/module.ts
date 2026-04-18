import type { OpenAPIHono } from "@hono/zod-openapi";
import type { AppConfig } from "@/shared/config/types";

export type AppModule = {
  name: keyof AppConfig["features"];
  register: (app: OpenAPIHono, config: AppConfig) => void;
};
