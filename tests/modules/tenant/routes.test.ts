import { describe, expect, it } from "bun:test";
import { OpenAPIHono } from "@hono/zod-openapi";
import {
  registerTenantRoutes,
  type TenantRouteServices,
} from "@/modules/tenant/http/routes";

function createTenantRouteServices(): TenantRouteServices {
  return {
    createTenant: async ({ name, slug }) => ({
      id: "tenant-1",
      name,
      slug,
    }),
    createInvitation: async ({ tenantId, email }) => ({
      id: "inv-1",
      tenantId,
      email,
      status: "pending",
    }),
    assignRole: async ({ tenantId, userId, roleId }) => ({
      id: "utr-1",
      tenantId,
      userId,
      roleId,
    }),
    acceptInvitation: async ({ token, userId }) => ({
      invitationId: "inv-1",
      tenantId: "tenant-1",
      userId,
      status: "accepted",
      token,
    }),
    listMembers: async ({ tenantId }) => [
      {
        id: "membership-1",
        tenantId,
        userId: "user-1",
        status: "active",
      },
    ],
  };
}

describe("tenant admin routes", () => {
  it("creates invitations through the tenant module service boundary", async () => {
    const app = new OpenAPIHono();

    registerTenantRoutes(app, createTenantRouteServices());

    const invitationRes = await app.request("/api/admin/tenants/tenant-1/invitations", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: "member@example.com",
        invitedByUserId: "user-1",
      }),
    });

    expect(invitationRes.status).toBe(200);
    expect(await invitationRes.json()).toEqual({
      id: "inv-1",
      tenantId: "tenant-1",
      email: "member@example.com",
      status: "pending",
    });
  });

  it("assigns tenant roles through the tenant module service boundary", async () => {
    const app = new OpenAPIHono();

    registerTenantRoutes(app, createTenantRouteServices());

    const roleRes = await app.request("/api/admin/tenants/tenant-1/roles/assign", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        userId: "user-1",
        roleId: "role-1",
      }),
    });

    expect(roleRes.status).toBe(200);
    expect(await roleRes.json()).toEqual({
      id: "utr-1",
      tenantId: "tenant-1",
      userId: "user-1",
      roleId: "role-1",
    });
  });

  it("accepts tenant invitations through the tenant module service boundary", async () => {
    const app = new OpenAPIHono();

    registerTenantRoutes(app, createTenantRouteServices());

    const acceptRes = await app.request("/api/public/tenant-invitations/accept", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        token: "invite-token",
        userId: "user-1",
      }),
    });

    expect(acceptRes.status).toBe(200);
    expect(await acceptRes.json()).toEqual({
      invitationId: "inv-1",
      tenantId: "tenant-1",
      userId: "user-1",
      status: "accepted",
      token: "invite-token",
    });
  });

  it("lists tenant members through the tenant module service boundary", async () => {
    const app = new OpenAPIHono();

    registerTenantRoutes(app, createTenantRouteServices());

    const membersRes = await app.request("/api/admin/tenants/tenant-1/members");

    expect(membersRes.status).toBe(200);
    expect(await membersRes.json()).toEqual({
      items: [
        {
          id: "membership-1",
          tenantId: "tenant-1",
          userId: "user-1",
          status: "active",
        },
      ],
    });
  });
});
