import type { Context, Next } from "hono";

export async function attachTenantContext(c: Context, next: Next) {
  const tenantId = c.req.header("x-tenant-id");
  c.set("tenantId", tenantId ?? null);
  await next();
}
