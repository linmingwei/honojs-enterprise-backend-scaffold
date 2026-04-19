import { and, eq, gt } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { roles, userTenantRoles } from "@/modules/rbac/persistence/schema";
import { tenantInvitations, tenantMemberships } from "../persistence/schema";

export type AcceptTenantInvitationInput = {
  token: string;
  userId: string;
};

export async function acceptTenantInvitation(input: AcceptTenantInvitationInput) {
  const now = new Date();

  return db.transaction(async (tx) => {
    const [invitation] = await tx
      .select()
      .from(tenantInvitations)
      .where(
        and(
          eq(tenantInvitations.token, input.token),
          eq(tenantInvitations.status, "pending"),
          gt(tenantInvitations.expiresAt, now),
        ),
      )
      .limit(1);

    if (!invitation) {
      throw new Error("invitation_not_found_or_expired");
    }

    const [membership] = await tx
      .insert(tenantMemberships)
      .values({
        tenantId: invitation.tenantId,
        userId: input.userId,
        status: "active",
      })
      .onConflictDoNothing()
      .returning();

    const [existingMembership] =
      membership
        ? [membership]
        : await tx
            .select()
            .from(tenantMemberships)
            .where(
              and(
                eq(tenantMemberships.tenantId, invitation.tenantId),
                eq(tenantMemberships.userId, input.userId),
              ),
            )
            .limit(1);

    const [defaultRole] = await tx
      .select()
      .from(roles)
      .where(and(eq(roles.scope, "tenant"), eq(roles.name, "tenant-member")))
      .limit(1);

    if (defaultRole) {
      await tx
        .insert(userTenantRoles)
        .values({
          tenantId: invitation.tenantId,
          userId: input.userId,
          roleId: defaultRole.id,
        })
        .onConflictDoNothing();
    }

    const [acceptedInvitation] = await tx
      .update(tenantInvitations)
      .set({
        status: "accepted",
        acceptedAt: now,
      })
      .where(eq(tenantInvitations.id, invitation.id))
      .returning();

    return {
      invitationId: acceptedInvitation.id,
      tenantId: acceptedInvitation.tenantId,
      userId: input.userId,
      status: acceptedInvitation.status,
      membershipId: existingMembership?.id ?? null,
    };
  });
}
