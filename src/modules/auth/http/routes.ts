import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { and, desc, eq, ilike, or } from "drizzle-orm";
import { auth } from "@/infrastructure/auth/better-auth";
import { db } from "@/infrastructure/db/client";
import { AppError } from "@/shared/errors/app-error";
import { users as authUsers } from "../persistence/schema";
import { resolveLoginIdentifier } from "../application/resolve-identifier";

const unifiedLoginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().optional(),
  otp: z.string().optional(),
  rememberMe: z.boolean().optional(),
});

const requestOtpSchema = z.object({
  identifier: z.string().min(1),
});

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  username: z.string().min(3).optional(),
});

const createAdminUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.string().optional(),
});

const listAdminUsersSchema = z.object({
  q: z.string().min(1).optional(),
  role: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type AuthRouteServices = {
  listUsers: (query: {
    q?: string;
    role?: string;
    limit: number;
  }) => Promise<
    {
      id: string;
      email: string;
      name: string;
      role: string | null;
    }[]
  >;
};

const listAdminUsersRoute = createRoute({
  method: "get",
  path: "/api/admin/users",
  request: {
    query: listAdminUsersSchema,
  },
  responses: {
    200: {
      description: "Admin user list",
      content: {
        "application/json": {
          schema: z.object({
            items: z.array(
              z.object({
                id: z.string(),
                email: z.string().email(),
                name: z.string(),
                role: z.string().nullable(),
              }),
            ),
          }),
        },
      },
    },
  },
});

function createAuthProxyRequest(
  request: Request,
  pathname: string,
  body: Record<string, unknown>,
) {
  const url = new URL(request.url);
  url.pathname = pathname;
  const headers = new Headers(request.headers);
  headers.set("content-type", "application/json");

  return new Request(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function resolvePasswordEndpoint(identifier: ReturnType<typeof resolveLoginIdentifier>) {
  switch (identifier.kind) {
    case "email":
      return {
        pathname: "/api/auth/sign-in/email",
        key: "email",
      } as const;
    case "phone":
      return {
        pathname: "/api/auth/sign-in/phone-number",
        key: "phoneNumber",
      } as const;
    case "username":
      return {
        pathname: "/api/auth/sign-in/username",
        key: "username",
      } as const;
  }
}

function resolveOtpEndpoint(identifier: ReturnType<typeof resolveLoginIdentifier>) {
  switch (identifier.kind) {
    case "email":
      return {
        pathname: "/api/auth/sign-in/email-otp",
        key: "email",
        otpKey: "otp",
      } as const;
    case "phone":
      return {
        pathname: "/api/auth/phone-number/verify",
        key: "phoneNumber",
        otpKey: "code",
      } as const;
    case "username":
      throw new AppError("Username does not support OTP login", 400, "invalid_otp_login");
  }
}

const defaultAuthRouteServices: AuthRouteServices = {
  listUsers: async ({ q, role, limit }) => {
    const qFilter = q
      ? or(
          ilike(authUsers.email, `%${q}%`),
          ilike(authUsers.name, `%${q}%`),
          ilike(authUsers.username, `%${q}%`),
          ilike(authUsers.phoneNumber, `%${q}%`),
        )
      : undefined;
    const roleFilter = role ? eq(authUsers.role, role) : undefined;
    const whereClause =
      qFilter && roleFilter ? and(qFilter, roleFilter) : (qFilter ?? roleFilter);

    return db
      .select({
        id: authUsers.id,
        email: authUsers.email,
        name: authUsers.name,
        role: authUsers.role,
      })
      .from(authUsers)
      .where(whereClause)
      .orderBy(desc(authUsers.createdAt))
      .limit(limit);
  },
};

export function registerAuthRoutes(
  app: OpenAPIHono,
  services: AuthRouteServices = defaultAuthRouteServices,
) {
  app.post("/api/auth/register", async (c) => {
    const body = registerSchema.parse(await c.req.json());

    return auth.handler(
      createAuthProxyRequest(c.req.raw, "/api/auth/sign-up/email", {
        email: body.email,
        password: body.password,
        name: body.name,
        username: body.username,
      }),
    );
  });

  app.post("/api/auth/unified-login", async (c) => {
    const body = unifiedLoginSchema.parse(await c.req.json());
    const resolved = resolveLoginIdentifier(body.identifier);

    if (!body.password && !body.otp) {
      throw new AppError(
        "Either password or otp is required",
        400,
        "missing_auth_factor",
      );
    }

    if (body.password) {
      const endpoint = resolvePasswordEndpoint(resolved);
      const response = await auth.handler(
        createAuthProxyRequest(c.req.raw, endpoint.pathname, {
          [endpoint.key]: resolved.value,
          password: body.password,
          rememberMe: body.rememberMe,
        }),
      );
      return response;
    }

    const endpoint = resolveOtpEndpoint(resolved);
    const response = await auth.handler(
      createAuthProxyRequest(c.req.raw, endpoint.pathname, {
        [endpoint.key]: resolved.value,
        [endpoint.otpKey]: body.otp,
      }),
    );
    return response;
  });

  app.post("/api/auth/request-otp", async (c) => {
    const body = requestOtpSchema.parse(await c.req.json());
    const resolved = resolveLoginIdentifier(body.identifier);

    const response =
      resolved.kind === "email"
        ? await auth.handler(
            createAuthProxyRequest(c.req.raw, "/api/auth/email-otp/send-verification-otp", {
              email: resolved.value,
              type: "sign-in",
            }),
          )
        : await auth.handler(
            createAuthProxyRequest(c.req.raw, "/api/auth/phone-number/send-otp", {
              phoneNumber: resolved.value,
            }),
          );

    return response;
  });

  app.openapi(listAdminUsersRoute, async (c) => {
    const query = c.req.valid("query");
    const users = await services.listUsers(query);
    return c.json({ items: users });
  });

  app.post("/api/admin/users", async (c) => {
    const body = createAdminUserSchema.parse(await c.req.json());

    return auth.handler(
      createAuthProxyRequest(c.req.raw, "/api/auth/admin/create-user", {
        email: body.email,
        password: body.password,
        name: body.name,
        role: body.role ?? "admin",
      }),
    );
  });

  app.all("/api/auth/*", (c) => auth.handler(c.req.raw));
}
