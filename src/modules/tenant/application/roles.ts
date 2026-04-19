import { and, eq } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { roles, userTenantRoles } from "@/modules/rbac/persistence/schema";

export type AssignTenantRoleInput = {
  tenantId: string;
  userId: string;
  roleId: string;
};

export async function assignTenantRole(input: AssignTenantRoleInput) {
  const [created] = await db
    .insert(userTenantRoles)
    .values(input)
    .onConflictDoNothing()
    .returning();

  if (created) return created;

  const [existing] = await db
    .select()
    .from(userTenantRoles)
    .where(
      and(
        eq(userTenantRoles.tenantId, input.tenantId),
        eq(userTenantRoles.userId, input.userId),
        eq(userTenantRoles.roleId, input.roleId),
      ),
    )
    .limit(1);

  return existing;
}

export async function revokeTenantRole(input: AssignTenantRoleInput) {
  const [revoked] = await db
    .delete(userTenantRoles)
    .where(
      and(
        eq(userTenantRoles.tenantId, input.tenantId),
        eq(userTenantRoles.userId, input.userId),
        eq(userTenantRoles.roleId, input.roleId),
      ),
    )
    .returning();

  return {
    tenantId: input.tenantId,
    userId: input.userId,
    roleId: input.roleId,
    revoked: Boolean(revoked),
  };
}

export async function listTenantRoles() {
  return db.select().from(roles).where(eq(roles.scope, "tenant"));
}

export async function listTenantMemberRoles(input: {
  tenantId: string;
  userId: string;
}) {
  return db
    .select()
    .from(userTenantRoles)
    .where(
      and(
        eq(userTenantRoles.tenantId, input.tenantId),
        eq(userTenantRoles.userId, input.userId),
      ),
    );
}
