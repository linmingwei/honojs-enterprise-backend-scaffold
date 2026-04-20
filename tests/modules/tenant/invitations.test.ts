import { describe, expect, it } from "bun:test";
import {
  buildTenantInvitation,
  issueTenantInvitation,
} from "@/modules/tenant/application/invitations";

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

describe("issueTenantInvitation", () => {
  it("sends an invitation email when notifications are enabled", async () => {
    const sent: { to: string; subject: string; html: string }[] = [];

    const invitation = await issueTenantInvitation(
      {
        tenantId: "tenant-1",
        email: "member@example.com",
        invitedByUserId: "user-1",
      },
      {
        appBaseUrl: "https://api.example.com",
        notificationsEnabled: true,
        emailSender: {
          send: async (input) => {
            sent.push(input);
          },
        },
        saveInvitation: async () => ({
          id: "inv-1",
          tenantId: "tenant-1",
          email: "member@example.com",
          invitedByUserId: "user-1",
          token: "invite-token",
          status: "pending",
          expiresAt: new Date("2026-04-26T00:00:00.000Z"),
          acceptedAt: null,
          createdAt: new Date("2026-04-19T00:00:00.000Z"),
        }),
      },
    );

    expect(invitation.id).toBe("inv-1");
    expect(sent).toHaveLength(1);
    expect(sent[0]?.to).toBe("member@example.com");
    expect(sent[0]?.subject).toContain("tenant-1");
    expect(sent[0]?.html).toContain("invite-token");
    expect(sent[0]?.html).toContain("https://api.example.com");
  });

  it("skips email delivery when notifications are disabled", async () => {
    let sendCount = 0;

    await issueTenantInvitation(
      {
        tenantId: "tenant-1",
        email: "member@example.com",
        invitedByUserId: "user-1",
      },
      {
        notificationsEnabled: false,
        emailSender: {
          send: async () => {
            sendCount += 1;
          },
        },
        saveInvitation: async () => ({
          id: "inv-1",
          tenantId: "tenant-1",
          email: "member@example.com",
          invitedByUserId: "user-1",
          token: "invite-token",
          status: "pending",
          expiresAt: new Date("2026-04-26T00:00:00.000Z"),
          acceptedAt: null,
          createdAt: new Date("2026-04-19T00:00:00.000Z"),
        }),
      },
    );

    expect(sendCount).toBe(0);
  });
});
