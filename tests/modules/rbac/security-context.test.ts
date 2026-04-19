import { describe, expect, it } from "bun:test";
import { Hono } from "hono";
import { attachTenantContext } from "@/modules/tenant/http/tenant-context";
import { requirePermission } from "@/modules/rbac/http/require-permission";

describe("request security context", () => {
  it("attaches permissions from headers and blocks missing permission codes", async () => {
    const app = new Hono();

    app.use("*", attachTenantContext);
    app.use("/protected", requirePermission("tenant.member.invite"));
    app.get("/protected", (c) => c.json({ ok: true }));

    const denied = await app.request("/protected");
    expect(denied.status).toBe(403);

    const allowed = await app.request("/protected", {
      headers: {
        "x-tenant-id": "tenant-1",
        "x-principal-id": "user-1",
        "x-tenant-permissions": "tenant.member.invite",
      },
    });

    expect(allowed.status).toBe(200);
  });
});
