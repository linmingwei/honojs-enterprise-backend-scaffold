import {
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    scope: text("scope").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    roleScopeNameUnique: uniqueIndex("role_scope_name_unique").on(
      table.scope,
      table.name,
    ),
  }),
);

export const permissions = pgTable("permissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    roleId: uuid("role_id").notNull(),
    permissionId: uuid("permission_id").notNull(),
  },
  (table) => ({
    rolePermissionUnique: uniqueIndex("role_permission_unique").on(
      table.roleId,
      table.permissionId,
    ),
  }),
);

export const userGlobalRoles = pgTable(
  "user_global_roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    roleId: uuid("role_id").notNull(),
  },
  (table) => ({
    userGlobalRoleUnique: uniqueIndex("user_global_role_unique").on(
      table.userId,
      table.roleId,
    ),
  }),
);

export const userTenantRoles = pgTable(
  "user_tenant_roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    tenantId: uuid("tenant_id").notNull(),
    roleId: uuid("role_id").notNull(),
  },
  (table) => ({
    userTenantRoleUnique: uniqueIndex("user_tenant_role_unique").on(
      table.userId,
      table.tenantId,
      table.roleId,
    ),
  }),
);

export const menus = pgTable("menus", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  permissionCode: text("permission_code"),
});

export const apiPolicies = pgTable("api_policies", {
  id: uuid("id").defaultRandom().primaryKey(),
  method: text("method").notNull(),
  path: text("path").notNull(),
  permissionCode: text("permission_code").notNull(),
});
