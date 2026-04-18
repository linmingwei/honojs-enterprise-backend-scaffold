import { swaggerUI } from "@hono/swagger-ui";
import type { OpenAPIHono } from "@hono/zod-openapi";

export function registerDocs(app: OpenAPIHono) {
  app.doc31("/openapi.json", {
    openapi: "3.1.0",
    info: {
      title: "Hono Enterprise Backend",
      version: "0.1.0",
    },
  });
  app.get("/docs", swaggerUI({ url: "/openapi.json" }));
}
