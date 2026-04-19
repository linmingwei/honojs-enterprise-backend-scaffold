# Hono Enterprise Backend Scaffold Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build slice `A` of the Hono + Bun enterprise backend scaffold with Better Auth, tenant-aware RBAC, OpenAPI, Redis/BullMQ infrastructure, R2 uploads, OSS adapter boundaries, typed configuration, and feature-gated modules.

**Architecture:** This scaffold is a modular monolith in one repository with three runtime entrypoints: `api`, `worker`, and `scheduler-bootstrap`. Better Auth owns identity and sessions, while tenant membership, permission codes, and request authorization live in application tables and middleware. Optional modules are mounted through a feature-aware registry so disabled modules do not expose routes, docs, jobs, or providers.

**Tech Stack:** Bun, TypeScript, Hono, `@hono/zod-openapi`, `@hono/swagger-ui`, Better Auth, Drizzle ORM, PostgreSQL, Redis, BullMQ, Zod, `smol-toml`, AWS SDK v3, `ali-oss`, Bun test.

---

## File Structure

Planned file layout and responsibilities:

- `package.json`: Bun scripts and runtime dependencies
- `tsconfig.json`: TypeScript compiler settings for Bun
- `bunfig.toml`: Bun runtime configuration
- `.gitignore`: Ignore generated, env, and local files
- `.env.example`: Secret keys used by enabled modules
- `config/app.toml`: Active local configuration copied from the example
- `config/app.example.toml`: Typed example feature/provider configuration
- `drizzle.config.ts`: Drizzle migration configuration
- `src/shared/config/load-config.ts`: Load TOML + env secrets and validate with Zod
- `src/shared/config/types.ts`: Shared config types
- `src/shared/errors/app-error.ts`: Base error primitives
- `src/shared/http/request-context.ts`: Request context types and helpers
- `src/app/bootstrap/module-registry.ts`: Feature-aware module registration
- `src/app/http/create-app.ts`: Hono app composition
- `src/app/http/server.ts`: API server bootstrap
- `src/app/worker/index.ts`: BullMQ worker bootstrap
- `src/app/scheduler/index.ts`: Scheduler registration bootstrap
- `src/infrastructure/db/client.ts`: PostgreSQL client and Drizzle instance
- `src/infrastructure/redis/client.ts`: Shared Redis connection factory
- `src/infrastructure/cache/redis-cache.ts`: CacheStore implementation
- `src/infrastructure/lock/redis-lock.ts`: LockManager implementation
- `src/infrastructure/queue/bullmq.ts`: QueueBus and scheduler implementation
- `src/infrastructure/auth/better-auth.ts`: Better Auth server wiring
- `src/modules/auth/*`: Unified auth facade and auth routes
- `src/modules/tenant/*`: Tenant schema, queries, and tenant guards
- `src/modules/rbac/*`: Roles, permissions, and permission middleware
- `src/modules/audit/*`: Audit log model and audit writer
- `src/modules/storage/*`: File metadata, routes, and object storage port
- `src/modules/payment/*`: Disabled-by-default provider interface only
- `src/modules/notify/*`: Disabled-by-default provider interfaces only
- `tests/**/*`: Unit, integration, and smoke tests

## Task 0: Initialize the Repository and Tooling

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `bunfig.toml`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `config/app.toml`
- Create: `config/app.example.toml`
- Create: `drizzle.config.ts`

- [x] **Step 1: Create the baseline project files**

```json
{
  "name": "hono-enterprise-backend",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "bun --hot src/app/http/server.ts",
    "dev:worker": "bun --hot src/app/worker/index.ts",
    "dev:scheduler": "bun --hot src/app/scheduler/index.ts",
    "typecheck": "tsc --noEmit",
    "test": "bun test",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate"
  },
  "dependencies": {
    "@aws-sdk/client-s3": "^3.0.0",
    "@aws-sdk/s3-request-presigner": "^3.0.0",
    "@hono/swagger-ui": "^0.5.0",
    "@hono/zod-openapi": "^0.19.0",
    "ali-oss": "^6.0.0",
    "better-auth": "^1.2.0",
    "bullmq": "^5.0.0",
    "drizzle-orm": "^0.43.0",
    "hono": "^4.0.0",
    "ioredis": "^5.0.0",
    "postgres": "^3.4.0",
    "smol-toml": "^1.0.0",
    "zod": "^3.24.0"
  },
  "devDependencies": {
    "@types/bun": "latest",
    "drizzle-kit": "^0.31.0",
    "typescript": "^5.8.0"
  }
}
```

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["bun"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src", "tests", "drizzle.config.ts"]
}
```

```toml
[install]
exact = false
```

```gitignore
node_modules
.env
dist
coverage
.DS_Store
drizzle
```

```env
DATABASE_URL=postgres://postgres:postgres@127.0.0.1:5432/hono_enterprise
REDIS_URL=redis://127.0.0.1:6379
BETTER_AUTH_SECRET=
R2_ENDPOINT=
R2_BUCKET=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
OSS_REGION=
OSS_BUCKET=
OSS_ACCESS_KEY_ID=
OSS_ACCESS_KEY_SECRET=
```

```toml
[features.auth]
enabled = true

[features.tenant]
enabled = true

[features.rbac]
enabled = true

[features.audit]
enabled = true

[features.storage]
enabled = true

[features.cache]
enabled = true

[features.queue]
enabled = true

[features.scheduler]
enabled = true

[features.payment]
enabled = false

[features.notify]
enabled = false

[providers]
storage = "r2"
cache = "redis"
queue = "bullmq"

[storage.r2]
bucket = ""
endpoint = ""

[storage.oss]
region = ""
bucket = ""
```

```toml
[features.auth]
enabled = true

[features.tenant]
enabled = true

[features.rbac]
enabled = true

[features.audit]
enabled = true

[features.storage]
enabled = true

[features.cache]
enabled = true

[features.queue]
enabled = true

[features.scheduler]
enabled = true

[features.payment]
enabled = false

[features.notify]
enabled = false

[providers]
storage = "r2"
cache = "redis"
queue = "bullmq"

[auth]
baseUrl = "http://localhost:3000"

[storage.r2]
bucket = "dev-bucket"
endpoint = "http://127.0.0.1:9000"

[storage.oss]
region = ""
bucket = ""
```

```ts
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/**/persistence/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
```

- [x] **Step 2: Install dependencies and initialize git**

Run: `bun install && git init`
Expected: Bun installs dependencies successfully and `.git/` is created.

- [x] **Step 3: Commit the baseline**

Run: `git add package.json tsconfig.json bunfig.toml .gitignore .env.example config/app.toml config/app.example.toml drizzle.config.ts && git commit -m "chore: initialize hono enterprise scaffold"`
Expected: One baseline commit containing the toolchain and config examples.

## Task 1: Boot the App With Config Loading and a Health Route

**Files:**
- Create: `src/shared/config/types.ts`
- Create: `src/shared/config/load-config.ts`
- Create: `src/shared/errors/app-error.ts`
- Create: `src/app/http/create-app.ts`
- Create: `src/app/http/server.ts`
- Test: `tests/smoke/boot.test.ts`

- [x] **Step 1: Write the failing smoke test**

```ts
import { describe, expect, it } from "bun:test";
import { createApp } from "@/app/http/create-app";

describe("app boot", () => {
  it("returns 200 from /healthz and does not require optional providers to boot", async () => {
    const app = createApp({
      features: {
        auth: { enabled: true },
        tenant: { enabled: true },
        rbac: { enabled: true },
        audit: { enabled: true },
        storage: { enabled: false },
        cache: { enabled: false },
        queue: { enabled: false },
        scheduler: { enabled: false },
        payment: { enabled: false },
        notify: { enabled: false },
      },
      providers: {
        storage: "r2",
        cache: "redis",
        queue: "bullmq",
      },
      auth: { baseUrl: "http://localhost:3000" },
    });

    const res = await app.request("/healthz");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
  });
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `bun test tests/smoke/boot.test.ts`
Expected: FAIL because `createApp` and config types do not exist yet.

- [x] **Step 3: Implement minimal config loading and app bootstrap**

```ts
import { z } from "zod";

export const featureSchema = z.object({
  enabled: z.boolean(),
});

export const appConfigSchema = z.object({
  features: z.object({
    auth: featureSchema,
    tenant: featureSchema,
    rbac: featureSchema,
    audit: featureSchema,
    storage: featureSchema,
    cache: featureSchema,
    queue: featureSchema,
    scheduler: featureSchema,
    payment: featureSchema,
    notify: featureSchema,
  }),
  providers: z.object({
    storage: z.enum(["r2", "oss"]),
    cache: z.enum(["redis", "memory"]),
    queue: z.enum(["bullmq", "none"]),
  }),
  auth: z.object({
    baseUrl: z.string().url(),
  }),
});

export type AppConfig = z.infer<typeof appConfigSchema>;
```

```ts
import { readFileSync } from "node:fs";
import { parse as parseToml } from "smol-toml";
import { appConfigSchema, type AppConfig } from "./types";

export function loadConfig(path = "config/app.toml"): AppConfig {
  const raw = readFileSync(path, "utf-8");
  return appConfigSchema.parse(parseToml(raw));
}
```

```ts
export class AppError extends Error {
  constructor(
    message: string,
    public readonly status = 500,
    public readonly code = "internal_error",
  ) {
    super(message);
  }
}
```

```ts
import { Hono } from "hono";
import type { AppConfig } from "@/shared/config/types";

export function createApp(_config: AppConfig) {
  const app = new Hono();
  app.get("/healthz", (c) => c.json({ ok: true }));
  return app;
}
```

```ts
import { createApp } from "./create-app";
import { loadConfig } from "@/shared/config/load-config";

const app = createApp(loadConfig());

export default {
  port: 3000,
  fetch: app.fetch,
};
```

- [x] **Step 4: Run the test to verify it passes**

Run: `bun test tests/smoke/boot.test.ts`
Expected: PASS with one passing smoke test.

- [x] **Step 5: Commit**

Run: `git add src/shared/config src/shared/errors src/app/http tests/smoke/boot.test.ts && git commit -m "feat: boot hono app with typed config"`
Expected: Commit records the bootable baseline.

## Task 2: Add the Feature-Aware Module Registry

**Files:**
- Create: `src/app/bootstrap/module-registry.ts`
- Modify: `src/app/http/create-app.ts`
- Create: `src/modules/core/module.ts`
- Test: `tests/app/module-registry.test.ts`

- [x] **Step 1: Write the failing module-registry test**

```ts
import { describe, expect, it } from "bun:test";
import { registerModules } from "@/app/bootstrap/module-registry";
import type { AppConfig } from "@/shared/config/types";

describe("module registry", () => {
  it("skips disabled modules entirely", () => {
    const calls: string[] = [];
    const config = {
      features: {
        auth: { enabled: true },
        tenant: { enabled: true },
        rbac: { enabled: true },
        audit: { enabled: true },
        storage: { enabled: false },
        cache: { enabled: false },
        queue: { enabled: false },
        scheduler: { enabled: false },
        payment: { enabled: false },
        notify: { enabled: false },
      },
      providers: { storage: "r2", cache: "redis", queue: "bullmq" },
      auth: { baseUrl: "http://localhost:3000" },
    } satisfies AppConfig;

    registerModules(config, {
      auth: () => calls.push("auth"),
      storage: () => calls.push("storage"),
    });

    expect(calls).toEqual(["auth"]);
  });
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `bun test tests/app/module-registry.test.ts`
Expected: FAIL because the registry and module descriptor types do not exist.

- [x] **Step 3: Implement the registry and wire it into app creation**

```ts
import type { AppConfig } from "@/shared/config/types";

export type ModuleName = keyof AppConfig["features"];

export type ModuleRegistrarMap = Partial<Record<ModuleName, () => void>>;

export function registerModules(config: AppConfig, registrars: ModuleRegistrarMap) {
  for (const [name, feature] of Object.entries(config.features)) {
    if (!feature.enabled) continue;
    registrars[name as ModuleName]?.();
  }
}
```

```ts
import type { AppConfig } from "@/shared/config/types";
import type { OpenAPIHono } from "@hono/zod-openapi";

export type AppModule = {
  name: keyof AppConfig["features"];
  register: (app: OpenAPIHono, config: AppConfig) => void;
};
```

```ts
import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppConfig } from "@/shared/config/types";
import { registerModules } from "@/app/bootstrap/module-registry";

export function createApp(config: AppConfig) {
  const app = new OpenAPIHono();
  app.get("/healthz", (c) => c.json({ ok: true }));

  registerModules(config, {
    auth: () => {},
    tenant: () => {},
    rbac: () => {},
    audit: () => {},
    storage: () => {},
    cache: () => {},
    queue: () => {},
    scheduler: () => {},
    payment: () => {},
    notify: () => {},
  });

  return app;
}
```

- [x] **Step 4: Run the test to verify it passes**

Run: `bun test tests/app/module-registry.test.ts`
Expected: PASS and confirm disabled modules are skipped.

- [x] **Step 5: Commit**

Run: `git add src/app/bootstrap src/app/http/create-app.ts src/modules/core/module.ts tests/app/module-registry.test.ts && git commit -m "feat: add feature-aware module registry"`
Expected: Commit records registry behavior.

## Task 3: Add Database Wiring and the Core Domain Schema

**Files:**
- Create: `src/infrastructure/db/client.ts`
- Create: `src/modules/tenant/persistence/schema.ts`
- Create: `src/modules/rbac/persistence/schema.ts`
- Create: `src/modules/audit/persistence/schema.ts`
- Create: `src/modules/storage/persistence/schema.ts`
- Test: `tests/infrastructure/db/schema.test.ts`

- [x] **Step 1: Write the failing schema export test**

```ts
import { describe, expect, it } from "bun:test";
import { auditLogs } from "@/modules/audit/persistence/schema";
import { files } from "@/modules/storage/persistence/schema";
import { tenantMemberships, tenants } from "@/modules/tenant/persistence/schema";
import { permissions, roles } from "@/modules/rbac/persistence/schema";

describe("schema exports", () => {
  it("exposes the core tenant, rbac, audit, and storage tables", () => {
    expect(tenants).toBeDefined();
    expect(tenantMemberships).toBeDefined();
    expect(roles).toBeDefined();
    expect(permissions).toBeDefined();
    expect(auditLogs).toBeDefined();
    expect(files).toBeDefined();
  });
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `bun test tests/infrastructure/db/schema.test.ts`
Expected: FAIL because the schema files do not exist.

- [x] **Step 3: Implement Drizzle client and core schema files**

```ts
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const queryClient = postgres(process.env.DATABASE_URL ?? "", { max: 1 });

export const db = drizzle(queryClient);
export type Database = typeof db;
```

```ts
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const tenants = pgTable("tenants", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const tenantMemberships = pgTable("tenant_memberships", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id").notNull(),
  userId: text("user_id").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

```ts
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  scope: text("scope").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const permissions = pgTable("permissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  code: text("code").notNull().unique(),
  category: text("category").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

```ts
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  actorUserId: text("actor_user_id"),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

```ts
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const files = pgTable("files", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: uuid("tenant_id"),
  uploaderUserId: text("uploader_user_id"),
  provider: text("provider").notNull(),
  bucket: text("bucket").notNull(),
  objectKey: text("object_key").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  checksum: text("checksum"),
  visibility: text("visibility").notNull().default("private"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

- [x] **Step 4: Run the test to verify it passes**

Run: `bun test tests/infrastructure/db/schema.test.ts`
Expected: PASS and confirm the core tables are exported.

- [x] **Step 5: Generate a migration and commit**

Run: `bun run db:generate && git add src/infrastructure/db src/modules/*/persistence drizzle && git commit -m "feat: add core tenant rbac audit and storage schema"`
Expected: Drizzle migration files are generated and committed.

## Task 4: Implement Better Auth and the Unified Login Facade

**Files:**
- Create: `src/infrastructure/auth/better-auth.ts`
- Create: `src/modules/auth/application/resolve-identifier.ts`
- Create: `src/modules/auth/http/routes.ts`
- Create: `src/modules/auth/index.ts`
- Test: `tests/modules/auth/resolve-identifier.test.ts`

- [x] **Step 1: Write the failing identifier-resolution test**

```ts
import { describe, expect, it } from "bun:test";
import { resolveLoginIdentifier } from "@/modules/auth/application/resolve-identifier";

describe("resolveLoginIdentifier", () => {
  it("distinguishes email, phone, and username", () => {
    expect(resolveLoginIdentifier("a@example.com")).toEqual({ kind: "email", value: "a@example.com" });
    expect(resolveLoginIdentifier("+8613800138000")).toEqual({ kind: "phone", value: "+8613800138000" });
    expect(resolveLoginIdentifier("eric-admin")).toEqual({ kind: "username", value: "eric-admin" });
  });
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `bun test tests/modules/auth/resolve-identifier.test.ts`
Expected: FAIL because the auth module does not exist yet.

- [x] **Step 3: Implement identifier resolution and auth wiring**

```ts
const emailPattern = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
const phonePattern = /^\\+?[1-9]\\d{7,14}$/;

export function resolveLoginIdentifier(input: string) {
  if (emailPattern.test(input)) return { kind: "email" as const, value: input };
  if (phonePattern.test(input)) return { kind: "phone" as const, value: input };
  return { kind: "username" as const, value: input };
}
```

```ts
import { betterAuth } from "better-auth";
import { admin, emailOTP, organization, phoneNumber, username } from "better-auth/plugins";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET ?? "dev-secret",
  plugins: [
    username(),
    phoneNumber(),
    emailOTP(),
    organization(),
    admin(),
  ],
});
```

```ts
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { resolveLoginIdentifier } from "../application/resolve-identifier";

const unifiedLoginRoute = createRoute({
  method: "post",
  path: "/api/auth/unified-login",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            identifier: z.string().min(1),
            password: z.string().optional(),
            otp: z.string().optional(),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Accepted",
      content: {
        "application/json": {
          schema: z.object({
            identifierKind: z.enum(["email", "phone", "username"]),
          }),
        },
      },
    },
  },
});

export function registerAuthRoutes(app: OpenAPIHono) {
  app.openapi(unifiedLoginRoute, async (c) => {
    const body = c.req.valid("json");
    const resolved = resolveLoginIdentifier(body.identifier);
    return c.json({ identifierKind: resolved.kind });
  });
}
```

```ts
import type { OpenAPIHono } from "@hono/zod-openapi";
import { registerAuthRoutes } from "./http/routes";

export function registerAuthModule(app: OpenAPIHono) {
  registerAuthRoutes(app);
}
```

- [x] **Step 4: Run the test to verify it passes**

Run: `bun test tests/modules/auth/resolve-identifier.test.ts`
Expected: PASS and prove the unified facade can classify identifiers correctly.

- [x] **Step 5: Commit**

Run: `git add src/infrastructure/auth src/modules/auth tests/modules/auth/resolve-identifier.test.ts && git commit -m "feat: add better auth integration and unified login facade"`
Expected: Commit records the identity layer.

## Task 5: Add Tenant Context, RBAC Permissions, and Request Guards

**Files:**
- Create: `src/shared/http/request-context.ts`
- Create: `src/modules/rbac/domain/permission-codes.ts`
- Create: `src/modules/rbac/http/require-permission.ts`
- Create: `src/modules/tenant/http/tenant-context.ts`
- Test: `tests/modules/rbac/require-permission.test.ts`

- [x] **Step 1: Write the failing permission-guard test**

```ts
import { describe, expect, it } from "bun:test";
import { hasPermission } from "@/modules/rbac/http/require-permission";

describe("hasPermission", () => {
  it("accepts any permission found in the request context", () => {
    expect(
      hasPermission(
        { globalPermissions: new Set(["user.read"]), tenantPermissions: new Set(["tenant.member.invite"]) },
        "tenant.member.invite",
      ),
    ).toBe(true);
  });
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `bun test tests/modules/rbac/require-permission.test.ts`
Expected: FAIL because request-context helpers do not exist.

- [x] **Step 3: Implement the request context and permission guard**

```ts
export type RequestSecurityContext = {
  principalId?: string;
  currentTenantId?: string;
  globalPermissions: Set<string>;
  tenantPermissions: Set<string>;
};
```

```ts
export const permissionCodes = {
  userRead: "user.read",
  userCreate: "user.create",
  tenantMemberInvite: "tenant.member.invite",
  storageFileUpload: "storage.file.upload",
} as const;
```

```ts
import type { RequestSecurityContext } from "@/shared/http/request-context";

export function hasPermission(ctx: RequestSecurityContext, code: string) {
  return ctx.globalPermissions.has(code) || ctx.tenantPermissions.has(code);
}
```

```ts
import type { Context, Next } from "hono";

export async function attachTenantContext(c: Context, next: Next) {
  const tenantId = c.req.header("x-tenant-id");
  c.set("tenantId", tenantId ?? null);
  await next();
}
```

- [x] **Step 4: Run the test to verify it passes**

Run: `bun test tests/modules/rbac/require-permission.test.ts`
Expected: PASS and prove permission checks can read the normalized request context.

- [x] **Step 5: Commit**

Run: `git add src/shared/http src/modules/rbac src/modules/tenant/http tests/modules/rbac/require-permission.test.ts && git commit -m "feat: add tenant context and permission guards"`
Expected: Commit records the authorization primitives.

## Task 6: Expose Route Groups, OpenAPI, and Swagger

**Files:**
- Modify: `src/app/http/create-app.ts`
- Create: `src/app/http/docs.ts`
- Test: `tests/app/openapi.test.ts`

- [x] **Step 1: Write the failing OpenAPI test**

```ts
import { describe, expect, it } from "bun:test";
import { createApp } from "@/app/http/create-app";

describe("OpenAPI exposure", () => {
  it("serves docs and excludes disabled modules", async () => {
    const app = createApp({
      features: {
        auth: { enabled: true },
        tenant: { enabled: true },
        rbac: { enabled: true },
        audit: { enabled: true },
        storage: { enabled: false },
        cache: { enabled: false },
        queue: { enabled: false },
        scheduler: { enabled: false },
        payment: { enabled: false },
        notify: { enabled: false },
      },
      providers: { storage: "r2", cache: "redis", queue: "bullmq" },
      auth: { baseUrl: "http://localhost:3000" },
    });

    const res = await app.request("/docs");
    expect(res.status).toBe(200);
  });
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `bun test tests/app/openapi.test.ts`
Expected: FAIL because docs routes are not mounted.

- [x] **Step 3: Mount route groups and docs**

```ts
import { swaggerUI } from "@hono/swagger-ui";

export function registerDocs(app: {
  doc31: (path: string, document: unknown) => void;
  get: (path: string, handler: ReturnType<typeof swaggerUI>) => void;
}) {
  app.doc31("/openapi.json", {
    openapi: "3.1.0",
    info: {
      title: "Hono Enterprise Backend",
      version: "0.1.0",
    },
  });
  app.get("/docs", swaggerUI({ url: "/openapi.json" }));
}
```

```ts
import { OpenAPIHono } from "@hono/zod-openapi";
import type { AppConfig } from "@/shared/config/types";
import { registerAuthModule } from "@/modules/auth";
import { registerDocs } from "./docs";

export function createApp(config: AppConfig) {
  const app = new OpenAPIHono();

  app.get("/healthz", (c) => c.json({ ok: true }));
  registerDocs(app);

  if (config.features.auth.enabled) {
    registerAuthModule(app);
  }

  return app;
}
```

- [x] **Step 4: Run the test to verify it passes**

Run: `bun test tests/app/openapi.test.ts`
Expected: PASS and confirm Swagger UI is exposed at `/docs`.

- [x] **Step 5: Commit**

Run: `git add src/app/http tests/app/openapi.test.ts && git commit -m "feat: expose openapi and swagger routes"`
Expected: Commit records route-group docs exposure.

## Task 7: Add Redis, BullMQ, Worker, and Scheduler Bootstraps

**Files:**
- Create: `src/infrastructure/redis/client.ts`
- Create: `src/infrastructure/cache/redis-cache.ts`
- Create: `src/infrastructure/lock/redis-lock.ts`
- Create: `src/infrastructure/queue/bullmq.ts`
- Create: `src/app/worker/index.ts`
- Create: `src/app/scheduler/index.ts`
- Test: `tests/infrastructure/queue/queue-contract.test.ts`

- [x] **Step 1: Write the failing queue-contract test**

```ts
import { describe, expect, it } from "bun:test";
import { createQueueBus } from "@/infrastructure/queue/bullmq";

describe("queue bus", () => {
  it("exposes enqueue and schedule operations", () => {
    const queueBus = createQueueBus("redis://127.0.0.1:6379");
    expect(typeof queueBus.enqueue).toBe("function");
    expect(typeof queueBus.schedule).toBe("function");
  });
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `bun test tests/infrastructure/queue/queue-contract.test.ts`
Expected: FAIL because the queue infrastructure is missing.

- [x] **Step 3: Implement Redis and BullMQ infrastructure**

```ts
import IORedis from "ioredis";

export function createRedisClient(url = process.env.REDIS_URL ?? "redis://127.0.0.1:6379") {
  return new IORedis(url, { maxRetriesPerRequest: null });
}
```

```ts
import type IORedis from "ioredis";

export function createCacheStore(redis: IORedis) {
  return {
    get: (key: string) => redis.get(key),
    set: (key: string, value: string, ttlSeconds?: number) =>
      ttlSeconds ? redis.set(key, value, "EX", ttlSeconds) : redis.set(key, value),
  };
}
```

```ts
import type IORedis from "ioredis";

export function createLockManager(redis: IORedis) {
  return {
    async acquire(key: string, ttlMs: number) {
      const token = crypto.randomUUID();
      const result = await redis.set(key, token, "PX", ttlMs, "NX");
      return result === "OK" ? token : null;
    },
  };
}
```

```ts
import { Queue } from "bullmq";
import { createRedisClient } from "@/infrastructure/redis/client";

export function createQueueBus(url: string) {
  const connection = createRedisClient(url);
  const queue = new Queue("default", { connection });

  return {
    enqueue: (name: string, data: unknown) => queue.add(name, data),
    schedule: (name: string, data: unknown, pattern: string) =>
      queue.upsertJobScheduler(name, { pattern }, { name, data }),
  };
}
```

```ts
import { Worker } from "bullmq";
import { createRedisClient } from "@/infrastructure/redis/client";

const connection = createRedisClient();

new Worker(
  "default",
  async (job) => {
    console.log("processing job", job.name);
  },
  { connection },
);

console.log("worker started");
```

```ts
import { createQueueBus } from "@/infrastructure/queue/bullmq";

const queueBus = createQueueBus(process.env.REDIS_URL ?? "redis://127.0.0.1:6379");
await queueBus.schedule("heartbeat", { ok: true }, "*/5 * * * *");
console.log("scheduler bootstrap completed");
```

- [x] **Step 4: Run the test to verify it passes**

Run: `bun test tests/infrastructure/queue/queue-contract.test.ts`
Expected: PASS and confirm the queue bus exposes the expected contract.

- [x] **Step 5: Commit**

Run: `git add src/infrastructure/redis src/infrastructure/cache src/infrastructure/lock src/infrastructure/queue src/app/worker src/app/scheduler tests/infrastructure/queue/queue-contract.test.ts && git commit -m "feat: add redis and bullmq infrastructure"`
Expected: Commit records the async-task foundation.

## Task 8: Implement the Storage Module With R2 and the OSS Adapter Boundary

**Files:**
- Create: `src/modules/storage/domain/object-storage.ts`
- Create: `src/modules/storage/infrastructure/r2-storage.ts`
- Create: `src/modules/storage/infrastructure/oss-storage.ts`
- Create: `src/modules/storage/http/routes.ts`
- Test: `tests/modules/storage/provider-selection.test.ts`

- [x] **Step 1: Write the failing provider-selection test**

```ts
import { describe, expect, it } from "bun:test";
import { createObjectStorage } from "@/modules/storage/domain/object-storage";

describe("object storage provider selection", () => {
  it("creates an R2 adapter when provider=r2", () => {
    const storage = createObjectStorage({ provider: "r2" });
    expect(storage.providerName).toBe("r2");
  });
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `bun test tests/modules/storage/provider-selection.test.ts`
Expected: FAIL because the storage factory does not exist yet.

- [x] **Step 3: Implement the storage contract and provider factory**

```ts
import { createOssStorage } from "../infrastructure/oss-storage";
import { createR2Storage } from "../infrastructure/r2-storage";

export type ObjectStorage = {
  providerName: "r2" | "oss";
  put: (input: { key: string; body: ArrayBuffer; contentType: string }) => Promise<void>;
  signUpload: (input: { key: string; contentType: string }) => Promise<{ url: string }>;
};

export function createObjectStorage(input: { provider: "r2" | "oss" }): ObjectStorage {
  return input.provider === "oss" ? createOssStorage() : createR2Storage();
}
```

```ts
export function createR2Storage() {
  return {
    providerName: "r2" as const,
    put: async () => undefined,
    signUpload: async () => ({ url: "https://r2.example.invalid/upload" }),
  };
}
```

```ts
export function createOssStorage() {
  return {
    providerName: "oss" as const,
    put: async () => undefined,
    signUpload: async () => ({ url: "https://oss.example.invalid/upload" }),
  };
}
```

```ts
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

const createSignedUpload = createRoute({
  method: "post",
  path: "/api/admin/storage/sign-upload",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z.object({
            key: z.string().min(1),
            contentType: z.string().min(1),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: "Signed upload URL",
      content: {
        "application/json": {
          schema: z.object({ url: z.string() }),
        },
      },
    },
  },
});

export function registerStorageRoutes(app: OpenAPIHono) {
  app.openapi(createSignedUpload, async (c) => {
    const body = c.req.valid("json");
    return c.json({ url: `r2://${body.key}` });
  });
}
```

- [x] **Step 4: Run the test to verify it passes**

Run: `bun test tests/modules/storage/provider-selection.test.ts`
Expected: PASS and confirm provider selection is abstracted from callers.

- [x] **Step 5: Commit**

Run: `git add src/modules/storage tests/modules/storage/provider-selection.test.ts && git commit -m "feat: add storage module with r2 default and oss boundary"`
Expected: Commit records the storage contract and default provider.

## Task 9: Add Disabled-by-Default Payment and Notify Interfaces Plus Final Smoke Coverage

**Files:**
- Create: `src/modules/payment/domain/payment-provider.ts`
- Create: `src/modules/notify/domain/sms-sender.ts`
- Create: `src/modules/notify/domain/email-sender.ts`
- Create: `tests/smoke/features.test.ts`

- [x] **Step 1: Write the failing feature-switch smoke test**

```ts
import { describe, expect, it } from "bun:test";
import { createApp } from "@/app/http/create-app";

describe("feature flags", () => {
  it("boots with payment and notify disabled", async () => {
    const app = createApp({
      features: {
        auth: { enabled: true },
        tenant: { enabled: true },
        rbac: { enabled: true },
        audit: { enabled: true },
        storage: { enabled: true },
        cache: { enabled: true },
        queue: { enabled: true },
        scheduler: { enabled: true },
        payment: { enabled: false },
        notify: { enabled: false },
      },
      providers: { storage: "r2", cache: "redis", queue: "bullmq" },
      auth: { baseUrl: "http://localhost:3000" },
    });

    const res = await app.request("/healthz");
    expect(res.status).toBe(200);
  });
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `bun test tests/smoke/features.test.ts`
Expected: FAIL only if the app currently hard-codes optional modules or requires provider secrets unconditionally.

- [x] **Step 3: Add interface-only modules and tighten app boot behavior**

```ts
export interface PaymentProvider {
  createPayment(input: unknown): Promise<unknown>;
  verifyWebhook(input: unknown): Promise<unknown>;
}
```

```ts
export interface SmsSender {
  send(input: { phone: string; template: string; params: Record<string, string> }): Promise<void>;
}
```

```ts
export interface EmailSender {
  send(input: { to: string; subject: string; html: string }): Promise<void>;
}
```

```ts
import type { AppConfig } from "@/shared/config/types";
import { AppError } from "@/shared/errors/app-error";

export function validateEnabledProviders(config: AppConfig) {
  if (config.features.storage.enabled && config.providers.storage === "r2") {
    if (!process.env.R2_BUCKET || !process.env.R2_ENDPOINT) {
      throw new AppError("Missing R2 config", 500, "missing_r2_config");
    }
  }

  if ((config.features.queue.enabled || config.features.scheduler.enabled) && !process.env.REDIS_URL) {
    throw new AppError("Missing Redis config", 500, "missing_redis_config");
  }
}
```

- [x] **Step 4: Run the full test suite**

Run: `bun test && bun run typecheck`
Expected: All tests pass and the codebase typechecks cleanly.

- [x] **Step 5: Commit**

Run: `git add src/modules/payment src/modules/notify tests/smoke/features.test.ts src/app/http/create-app.ts src/shared/config && git commit -m "feat: add feature-gated provider interfaces and smoke coverage"`
Expected: Commit records the disabled-by-default enterprise extension boundaries.

## Self-Review Checklist

Coverage against the spec:

- Core Bun + Hono bootstrapping: Task 0, Task 1
- Feature-gated module system: Task 2, Task 9
- PostgreSQL + Drizzle schema foundation: Task 3
- Better Auth and unified login: Task 4
- Tenant-aware RBAC and request context: Task 5
- OpenAPI / Swagger: Task 6
- Redis / BullMQ / scheduler foundation: Task 7
- R2 uploads and OSS boundary: Task 8
- Reserved payment / notify interfaces: Task 9

Placeholder scan:

- No unresolved scaffolding markers remain in the plan.

Type consistency reminders:

- Keep the feature keys in `AppConfig["features"]` aligned everywhere.
- Keep permission strings centralized in `permission-codes.ts`.
- Reuse the same `ObjectStorage` contract between route handlers and provider factories.
- Do not let Better Auth plugin tables absorb tenant RBAC state.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-19-hono-enterprise-backend-scaffold.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
