import { describe, expect, it } from "bun:test";
import { buildTenantInvitation } from "@/modules/tenant/application/invitations";

describe("buildTenantInvitation", () => {
  it("creates a pending invitation with an expiry window", () => {
    const now = new Date("2026-04-19T00:00:00.000Z");

    const invitation = buildTenantInvitation(
      {
        tenantId: "tenant-1",
        email: "member@example.com",
        invitedByUserId: "user-1",
      },
      now,
    );

    expect(invitation.tenantId).toBe("tenant-1");
    expect(invitation.email).toBe("member@example.com");
    expect(invitation.invitedByUserId).toBe("user-1");
    expect(invitation.status).toBe("pending");
    expect(invitation.token.length).toBeGreaterThan(10);
    expect(invitation.expiresAt.toISOString()).toBe("2026-04-26T00:00:00.000Z");
  });
});
