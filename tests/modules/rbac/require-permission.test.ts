import { describe, expect, it } from "bun:test";
import { hasPermission } from "@/modules/rbac/http/require-permission";

describe("hasPermission", () => {
  it("accepts any permission found in the request context", () => {
    expect(
      hasPermission(
        {
          globalPermissions: new Set(["user.read"]),
          tenantPermissions: new Set(["tenant.member.invite"]),
        },
        "tenant.member.invite",
      ),
    ).toBe(true);
  });
});
