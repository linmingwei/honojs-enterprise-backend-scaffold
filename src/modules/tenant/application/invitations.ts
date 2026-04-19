import { and, eq } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
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
