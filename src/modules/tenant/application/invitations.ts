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
