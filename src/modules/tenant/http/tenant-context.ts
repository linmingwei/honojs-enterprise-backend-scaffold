import type { Context, Next } from "hono";
import {
  createAnonymousSecurityContext,
  parsePermissionHeader,
} from "@/shared/http/request-context";

export async function attachTenantContext(c: Context, next: Next) {
  const security = createAnonymousSecurityContext();

  security.principalId = c.req.header("x-principal-id") ?? undefined;
  security.currentTenantId = c.req.header("x-tenant-id") ?? undefined;
  security.globalPermissions = parsePermissionHeader(c.req.header("x-global-permissions"));
  security.tenantPermissions = parsePermissionHeader(c.req.header("x-tenant-permissions"));

  c.set("security", security);
  await next();
}
