import { and, eq } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import type { EmailSender } from "@/modules/notify/domain/email-sender";
import { tenantInvitations } from "../persistence/schema";

export type TenantInvitationInput = {
  tenantId: string;
  email: string;
  invitedByUserId: string;
};

export function buildTenantInvitation(
  input: TenantInvitationInput,
  now = new Date(),
) {
  return {
    ...input,
    token: crypto.randomUUID(),
    status: "pending" as const,
    expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
  };
}

export async function createTenantInvitation(input: TenantInvitationInput) {
  const invitation = buildTenantInvitation(input);
  const [created] = await db
    .insert(tenantInvitations)
    .values(invitation)
    .returning();

  return created;
}

export async function issueTenantInvitation(
  input: TenantInvitationInput,
  options?: {
    appBaseUrl?: string;
    notificationsEnabled?: boolean;
    emailSender?: EmailSender | null;
    saveInvitation?: typeof createTenantInvitation;
  },
) {
  const saveInvitation = options?.saveInvitation ?? createTenantInvitation;
  const invitation = await saveInvitation(input);

  if (options?.notificationsEnabled && options.emailSender) {
    const acceptUrl = options.appBaseUrl
      ? `${options.appBaseUrl.replace(/\/$/, "")}/api/public/tenant-invitations/${encodeURIComponent(invitation.token)}`
      : null;

    await options.emailSender.send({
      to: invitation.email,
      subject: `Invitation to join tenant ${invitation.tenantId}`,
      html: [
        `<p>You have been invited to join tenant <strong>${invitation.tenantId}</strong>.</p>`,
        `<p>Invitation token: <code>${invitation.token}</code></p>`,
        acceptUrl ? `<p>Accept invitation: <a href="${acceptUrl}">${acceptUrl}</a></p>` : "",
      ]
        .filter(Boolean)
        .join(""),
    });
  }

  return invitation;
}

export async function getTenantInvitation(input: { token: string }) {
  const [invitation] = await db
    .select()
    .from(tenantInvitations)
    .where(eq(tenantInvitations.token, input.token))
    .limit(1);

  if (!invitation) {
    throw new Error("invitation_not_found");
  }

  return invitation;
}

export async function listTenantInvitations(input: { tenantId: string }) {
  return db
    .select()
    .from(tenantInvitations)
    .where(eq(tenantInvitations.tenantId, input.tenantId));
}

export async function revokeTenantInvitation(input: {
  tenantId: string;
  invitationId: string;
}) {
  const [revoked] = await db
    .update(tenantInvitations)
    .set({
      status: "revoked",
    })
    .where(
      and(
        eq(tenantInvitations.id, input.invitationId),
        eq(tenantInvitations.tenantId, input.tenantId),
        eq(tenantInvitations.status, "pending"),
      ),
    )
    .returning();

  if (!revoked) {
    throw new Error("invitation_not_found_or_already_processed");
  }

  return revoked;
}
