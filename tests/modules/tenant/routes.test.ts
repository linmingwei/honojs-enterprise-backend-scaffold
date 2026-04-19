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
    listInvitations: async ({ tenantId }) => [
      {
        id: "inv-1",
        tenantId,
        email: "member@example.com",
        status: "pending",
      },
    ],
    revokeInvitation: async ({ invitationId, tenantId }) => ({
      id: invitationId,
      tenantId,
      email: "member@example.com",
      status: "revoked",
    }),
    revokeRole: async ({ tenantId, userId, roleId }) => ({
      tenantId,
      userId,
      roleId,
      revoked: true,
    }),
    deactivateMember: async ({ tenantId, userId }) => ({
      id: "membership-1",
      tenantId,
      userId,
      status: "inactive",
    }),
    listRoles: async () => [
      {
        id: "role-1",
        scope: "tenant",
        name: "tenant-admin",
      },
      {
        id: "role-2",
        scope: "tenant",
        name: "tenant-member",
      },
    ],
    listMemberRoles: async ({ tenantId, userId }) => [
      {
        id: "role-1",
        tenantId,
        userId,
        roleId: "role-1",
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

  it("lists tenant invitations through the tenant module service boundary", async () => {
    const app = new OpenAPIHono();

    registerTenantRoutes(app, createTenantRouteServices());

    const invitationsRes = await app.request("/api/admin/tenants/tenant-1/invitations");

    expect(invitationsRes.status).toBe(200);
    expect(await invitationsRes.json()).toEqual({
      items: [
        {
          id: "inv-1",
          tenantId: "tenant-1",
          email: "member@example.com",
          status: "pending",
        },
      ],
    });
  });

  it("revokes tenant invitations through the tenant module service boundary", async () => {
    const app = new OpenAPIHono();

    registerTenantRoutes(app, createTenantRouteServices());

    const revokeRes = await app.request(
      "/api/admin/tenants/tenant-1/invitations/inv-1/revoke",
      {
        method: "POST",
      },
    );

    expect(revokeRes.status).toBe(200);
    expect(await revokeRes.json()).toEqual({
      id: "inv-1",
      tenantId: "tenant-1",
      email: "member@example.com",
      status: "revoked",
    });
  });

  it("revokes tenant roles through the tenant module service boundary", async () => {
    const app = new OpenAPIHono();

    registerTenantRoutes(app, createTenantRouteServices());

    const revokeRoleRes = await app.request("/api/admin/tenants/tenant-1/roles/revoke", {
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({
        userId: "user-1",
        roleId: "role-1",
      }),
    });

    expect(revokeRoleRes.status).toBe(200);
    expect(await revokeRoleRes.json()).toEqual({
      tenantId: "tenant-1",
      userId: "user-1",
      roleId: "role-1",
      revoked: true,
    });
  });

  it("deactivates tenant members through the tenant module service boundary", async () => {
    const app = new OpenAPIHono();

    registerTenantRoutes(app, createTenantRouteServices());

    const deactivateRes = await app.request(
      "/api/admin/tenants/tenant-1/members/user-1/deactivate",
      {
        method: "POST",
      },
    );

    expect(deactivateRes.status).toBe(200);
    expect(await deactivateRes.json()).toEqual({
      id: "membership-1",
      tenantId: "tenant-1",
      userId: "user-1",
      status: "inactive",
    });
  });

  it("lists tenant role catalog through the tenant module service boundary", async () => {
    const app = new OpenAPIHono();

    registerTenantRoutes(app, createTenantRouteServices());

    const rolesRes = await app.request("/api/admin/tenants/tenant-1/roles");

    expect(rolesRes.status).toBe(200);
    expect(await rolesRes.json()).toEqual({
      items: [
        {
          id: "role-1",
          scope: "tenant",
          name: "tenant-admin",
        },
        {
          id: "role-2",
          scope: "tenant",
          name: "tenant-member",
        },
      ],
    });
  });

  it("lists member role assignments through the tenant module service boundary", async () => {
    const app = new OpenAPIHono();

    registerTenantRoutes(app, createTenantRouteServices());

    const memberRolesRes = await app.request("/api/admin/tenants/tenant-1/members/user-1/roles");

    expect(memberRolesRes.status).toBe(200);
    expect(await memberRolesRes.json()).toEqual({
      items: [
        {
          id: "role-1",
          tenantId: "tenant-1",
          userId: "user-1",
          roleId: "role-1",
        },
      ],
    });
  });
});
