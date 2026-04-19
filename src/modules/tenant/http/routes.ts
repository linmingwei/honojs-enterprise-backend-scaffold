import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { eq } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { userTenantRoles } from "@/modules/rbac/persistence/schema";
import { acceptTenantInvitation } from "../application/accept-invitation";
import { assignTenantRole } from "../application/roles";
import {
  createTenantInvitation,
  listTenantInvitations,
  revokeTenantInvitation,
} from "../application/invitations";
import { tenantMemberships, tenants } from "../persistence/schema";

const createTenantRoute = createRoute({
  method: "post",
  path: "/api/admin/tenants",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            name: z.string().min(1),
            slug: z.string().min(1),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Tenant created",
      content: {
        "application/json": {
          schema: z.object({
            id: z.string(),
            name: z.string(),
            slug: z.string(),
          }),
        },
      },
    },
  },
});

const inviteTenantMemberRoute = createRoute({
  method: "post",
  path: "/api/admin/tenants/{tenantId}/invitations",
  request: {
    params: z.object({
      tenantId: z.string().min(1),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            email: z.string().email(),
            invitedByUserId: z.string().min(1),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Invitation created",
      content: {
        "application/json": {
          schema: z.object({
            id: z.string(),
            tenantId: z.string(),
            email: z.string().email(),
            status: z.string(),
          }),
        },
      },
    },
  },
});

const assignTenantRoleRoute = createRoute({
  method: "post",
  path: "/api/admin/tenants/{tenantId}/roles/assign",
  request: {
    params: z.object({
      tenantId: z.string().min(1),
    }),
    body: {
      content: {
        "application/json": {
          schema: z.object({
            userId: z.string().min(1),
            roleId: z.string().min(1),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Role assigned",
      content: {
        "application/json": {
          schema: z.object({
            id: z.string(),
            tenantId: z.string(),
            userId: z.string(),
            roleId: z.string(),
          }),
        },
      },
    },
  },
});

const acceptInvitationRoute = createRoute({
  method: "post",
  path: "/api/public/tenant-invitations/accept",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            token: z.string().min(1),
            userId: z.string().min(1),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Invitation accepted",
      content: {
        "application/json": {
          schema: z.object({
            invitationId: z.string(),
            tenantId: z.string(),
            userId: z.string(),
            status: z.string(),
            membershipId: z.string().nullable().optional(),
          }),
        },
      },
    },
  },
});

const listTenantInvitationsRoute = createRoute({
  method: "get",
  path: "/api/admin/tenants/{tenantId}/invitations",
  request: {
    params: z.object({
      tenantId: z.string().min(1),
    }),
  },
  responses: {
    200: {
      description: "Tenant invitations",
      content: {
        "application/json": {
          schema: z.object({
            items: z.array(
              z.object({
                id: z.string(),
                tenantId: z.string(),
                email: z.string().email(),
                status: z.string(),
              }),
            ),
          }),
        },
      },
    },
  },
});

const listTenantMembersRoute = createRoute({
  method: "get",
  path: "/api/admin/tenants/{tenantId}/members",
  request: {
    params: z.object({
      tenantId: z.string().min(1),
    }),
  },
  responses: {
    200: {
      description: "Tenant members",
      content: {
        "application/json": {
          schema: z.object({
            items: z.array(
              z.object({
                id: z.string(),
                tenantId: z.string(),
                userId: z.string(),
                status: z.string(),
              }),
            ),
          }),
        },
      },
    },
  },
});

const revokeTenantInvitationRoute = createRoute({
  method: "post",
  path: "/api/admin/tenants/{tenantId}/invitations/{invitationId}/revoke",
  request: {
    params: z.object({
      tenantId: z.string().min(1),
      invitationId: z.string().min(1),
    }),
  },
  responses: {
    200: {
      description: "Invitation revoked",
      content: {
        "application/json": {
          schema: z.object({
            id: z.string(),
            tenantId: z.string(),
            email: z.string().email(),
            status: z.string(),
          }),
        },
      },
    },
  },
});

export type TenantRouteServices = {
  createTenant: (input: { name: string; slug: string }) => Promise<{
    id: string;
    name: string;
    slug: string;
  }>;
  createInvitation: (input: {
    tenantId: string;
    email: string;
    invitedByUserId: string;
  }) => Promise<{
    id: string;
    tenantId: string;
    email: string;
    status: string;
  }>;
  assignRole: (input: {
    tenantId: string;
    userId: string;
    roleId: string;
  }) => Promise<{
    id: string;
    tenantId: string;
    userId: string;
    roleId: string;
  }>;
  acceptInvitation: (input: {
    token: string;
    userId: string;
  }) => Promise<{
    invitationId: string;
    tenantId: string;
    userId: string;
    status: string;
    membershipId?: string | null;
    token?: string;
  }>;
  listMembers: (input: { tenantId: string }) => Promise<
    {
      id: string;
      tenantId: string;
      userId: string;
      status: string;
    }[]
  >;
  listInvitations: (input: { tenantId: string }) => Promise<
    {
      id: string;
      tenantId: string;
      email: string;
      status: string;
    }[]
  >;
  revokeInvitation: (input: {
    tenantId: string;
    invitationId: string;
  }) => Promise<{
    id: string;
    tenantId: string;
    email: string;
    status: string;
  }>;
};

const defaultTenantRouteServices: TenantRouteServices = {
  createTenant: async ({ name, slug }) => {
    const [created] = await db
      .insert(tenants)
      .values({ name, slug })
      .returning();

    return created;
  },
  createInvitation: async ({ tenantId, email, invitedByUserId }) => {
    const created = await createTenantInvitation({
      tenantId,
      email,
      invitedByUserId,
    });

    return {
      id: created.id,
      tenantId: created.tenantId,
      email: created.email,
      status: created.status,
    };
  },
  assignRole: async ({ tenantId, userId, roleId }) => {
    const created = await assignTenantRole({
      tenantId,
      userId,
      roleId,
    });

    if (!created) {
      throw new Error("failed to assign tenant role");
    }

    return created;
  },
  acceptInvitation: ({ token, userId }) =>
    acceptTenantInvitation({
      token,
      userId,
    }),
  listMembers: ({ tenantId }) =>
    db
      .select()
      .from(tenantMemberships)
      .where(eq(tenantMemberships.tenantId, tenantId)),
  listInvitations: ({ tenantId }) => listTenantInvitations({ tenantId }),
  revokeInvitation: ({ tenantId, invitationId }) =>
    revokeTenantInvitation({
      tenantId,
      invitationId,
    }),
};

export function registerTenantRoutes(
  app: OpenAPIHono,
  services: TenantRouteServices = defaultTenantRouteServices,
) {
  app.openapi(createTenantRoute, async (c) => {
    const body = c.req.valid("json");
    const created = await services.createTenant(body);
    return c.json(created);
  });

  app.openapi(inviteTenantMemberRoute, async (c) => {
    const params = c.req.valid("param");
    const body = c.req.valid("json");
    const created = await services.createInvitation({
      tenantId: params.tenantId,
      email: body.email,
      invitedByUserId: body.invitedByUserId,
    });
    return c.json(created);
  });

  app.openapi(assignTenantRoleRoute, async (c) => {
    const params = c.req.valid("param");
    const body = c.req.valid("json");
    const created = await services.assignRole({
      tenantId: params.tenantId,
      userId: body.userId,
      roleId: body.roleId,
    });
    return c.json(created);
  });

  app.openapi(acceptInvitationRoute, async (c) => {
    const body = c.req.valid("json");
    const accepted = await services.acceptInvitation(body);
    return c.json(accepted);
  });

  app.openapi(listTenantInvitationsRoute, async (c) => {
    const params = c.req.valid("param");
    const invitations = await services.listInvitations({
      tenantId: params.tenantId,
    });

    return c.json({ items: invitations });
  });

  app.openapi(listTenantMembersRoute, async (c) => {
    const params = c.req.valid("param");
    const members = await services.listMembers({
      tenantId: params.tenantId,
    });

    return c.json({ items: members });
  });

  app.openapi(revokeTenantInvitationRoute, async (c) => {
    const params = c.req.valid("param");
    const revoked = await services.revokeInvitation({
      tenantId: params.tenantId,
      invitationId: params.invitationId,
    });

    return c.json(revoked);
  });
}
