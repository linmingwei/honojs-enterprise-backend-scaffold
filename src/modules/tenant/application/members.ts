import { and, eq } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { tenantMemberships } from "../persistence/schema";

export async function deactivateTenantMember(input: {
  tenantId: string;
  userId: string;
}) {
  const [membership] = await db
    .update(tenantMemberships)
    .set({
      status: "inactive",
    })
    .where(
      and(
        eq(tenantMemberships.tenantId, input.tenantId),
        eq(tenantMemberships.userId, input.userId),
      ),
    )
    .returning();

  if (!membership) {
    throw new Error("tenant_membership_not_found");
  }

  return membership;
}
