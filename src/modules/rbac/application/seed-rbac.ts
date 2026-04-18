import { db } from "@/infrastructure/db/client";
import { permissionCodes } from "../domain/permission-codes";
import {
  permissions,
  roles,
  rolePermissions,
} from "../persistence/schema";

export const defaultPermissionCatalog = [
  { code: permissionCodes.userRead, category: "user" },
  { code: permissionCodes.userCreate, category: "user" },
  { code: permissionCodes.tenantMemberInvite, category: "tenant" },
  { code: permissionCodes.storageFileUpload, category: "storage" },
] as const;

export const defaultRoleCatalog = [
  { scope: "global", name: "super-admin" },
  { scope: "tenant", name: "tenant-admin" },
  { scope: "tenant", name: "tenant-member" },
] as const;

export async function seedRbac() {
  await db.insert(permissions).values(defaultPermissionCatalog as any).onConflictDoNothing();
  await db.insert(roles).values(defaultRoleCatalog as any).onConflictDoNothing();

  const storedRoles = await db.select().from(roles);
  const storedPermissions = await db.select().from(permissions);

  const roleByName = new Map(storedRoles.map((role) => [role.name, role.id]));
  const permissionByCode = new Map(
    storedPermissions.map((permission) => [permission.code, permission.id]),
  );

  const seedRelations = [
    {
      roleId: roleByName.get("super-admin"),
      permissionId: permissionByCode.get(permissionCodes.userRead),
    },
    {
      roleId: roleByName.get("super-admin"),
      permissionId: permissionByCode.get(permissionCodes.userCreate),
    },
    {
      roleId: roleByName.get("tenant-admin"),
      permissionId: permissionByCode.get(permissionCodes.tenantMemberInvite),
    },
    {
      roleId: roleByName.get("tenant-member"),
      permissionId: permissionByCode.get(permissionCodes.storageFileUpload),
    },
  ].filter(
    (
      relation,
    ): relation is { roleId: string; permissionId: string } =>
      Boolean(relation.roleId && relation.permissionId),
  );

  if (seedRelations.length > 0) {
    await db.insert(rolePermissions).values(seedRelations as any).onConflictDoNothing();
  }
}

if (import.meta.main) {
  await seedRbac();
}
