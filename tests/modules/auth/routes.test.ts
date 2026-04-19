import { describe, expect, it } from "bun:test";
import { OpenAPIHono } from "@hono/zod-openapi";
import { registerAuthRoutes, type AuthRouteServices } from "@/modules/auth/http/routes";

describe("auth admin routes", () => {
  it("lists admin users with forwarded filters through the auth route service boundary", async () => {
    const app = new OpenAPIHono();
    let receivedQuery:
      | {
          q?: string;
          role?: string;
          limit: number;
        }
      | undefined;

    const services: AuthRouteServices = {
      listUsers: async (query) => {
        receivedQuery = query;

        return [
          {
            id: "user-1",
            email: "admin@example.com",
            name: "Admin",
            role: "admin",
          },
        ];
      },
    };

    registerAuthRoutes(app, services);

    const res = await app.request("/api/admin/users?q=admin&role=admin&limit=10");

    expect(res.status).toBe(200);
    expect(receivedQuery).toEqual({
      q: "admin",
      role: "admin",
      limit: 10,
    });
    expect(await res.json()).toEqual({
      items: [
        {
          id: "user-1",
          email: "admin@example.com",
          name: "Admin",
          role: "admin",
        },
      ],
    });
  });
});
