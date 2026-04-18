import type { RequestSecurityContext } from "@/shared/http/request-context";

export function hasPermission(ctx: RequestSecurityContext, code: string) {
  return ctx.globalPermissions.has(code) || ctx.tenantPermissions.has(code);
}
