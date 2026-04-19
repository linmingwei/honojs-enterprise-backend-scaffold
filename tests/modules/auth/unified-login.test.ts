import { describe, expect, it, mock } from "bun:test";
import { OpenAPIHono } from "@hono/zod-openapi";
import { registerAuthRoutes } from "@/modules/auth/http/routes";

describe("auth unified login routing", () => {
  it("forwards username password logins to the username endpoint", async () => {
    const app = new OpenAPIHono();
    const handler = mock(async (request: Request) => {
      expect(new URL(request.url).pathname).toBe("/api/auth/sign-in/username");
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });

    registerAuthRoutes(app, undefined, { handler });

    const res = await app.request("/api/auth/unified-login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        identifier: "eric-admin",
        password: "secret-123",
      }),
    });

    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
