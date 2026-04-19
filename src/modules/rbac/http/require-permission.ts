import type { MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import type { RequestSecurityContext } from "@/shared/http/request-context";

export function hasPermission(ctx: RequestSecurityContext, code: string) {
  return ctx.globalPermissions.has(code) || ctx.tenantPermissions.has(code);
}

export function requirePermission(code: string): MiddlewareHandler {
  return async (c, next) => {
    const security = c.get("security") as RequestSecurityContext | undefined;

    if (!security || !hasPermission(security, code)) {
      throw new HTTPException(403, { message: "Forbidden" });
    }

    await next();
  };
}
