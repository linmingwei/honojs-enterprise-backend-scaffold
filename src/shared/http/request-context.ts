export type RequestSecurityContext = {
  principalId?: string;
  currentTenantId?: string;
  globalPermissions: Set<string>;
  tenantPermissions: Set<string>;
};

export function createAnonymousSecurityContext(): RequestSecurityContext {
  return {
    globalPermissions: new Set<string>(),
    tenantPermissions: new Set<string>(),
  };
}

export function parsePermissionHeader(value: string | undefined) {
  return new Set(
    (value ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  );
}
