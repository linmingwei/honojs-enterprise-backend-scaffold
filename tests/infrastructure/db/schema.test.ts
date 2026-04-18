import { describe, expect, it } from "bun:test";
import { auditLogs } from "@/modules/audit/persistence/schema";
import { files } from "@/modules/storage/persistence/schema";
import { tenantMemberships, tenants } from "@/modules/tenant/persistence/schema";
import { permissions, roles } from "@/modules/rbac/persistence/schema";

describe("schema exports", () => {
  it("exposes the core tenant, rbac, audit, and storage tables", () => {
    expect(tenants).toBeDefined();
    expect(tenantMemberships).toBeDefined();
    expect(roles).toBeDefined();
    expect(permissions).toBeDefined();
    expect(auditLogs).toBeDefined();
    expect(files).toBeDefined();
  });
});
