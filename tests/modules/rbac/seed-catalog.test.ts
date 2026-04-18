import { describe, expect, it } from "bun:test";
import {
  defaultPermissionCatalog,
  defaultRoleCatalog,
} from "@/modules/rbac/application/seed-rbac";

describe("rbac seed catalog", () => {
  it("contains the baseline permissions and roles", () => {
    expect(defaultPermissionCatalog.map((item) => item.code)).toContain("user.read");
    expect(defaultPermissionCatalog.map((item) => item.code)).toContain(
      "tenant.member.invite",
    );
    expect(defaultRoleCatalog.map((item) => item.name)).toContain("super-admin");
    expect(defaultRoleCatalog.map((item) => item.name)).toContain("tenant-admin");
  });
});
