# HonoJS Enterprise Backend Scaffold

[简体中文](./README.zh-CN.md)

An English-first HonoJS backend scaffold for multi-tenant admin systems.

This project is built as a modular monolith on top of Bun, Hono, Drizzle ORM, Better Auth, PostgreSQL, Redis, and BullMQ. It is designed to provide a solid backend foundation for enterprise-style dashboards, admin panels, and internal platforms.

## Highlights

- Hono + Bun runtime with OpenAPI and Swagger
- Better Auth integration with unified login dispatch
- Tenant-aware RBAC with invitation, membership, and role management
- Feature-gated module registry
- PostgreSQL + Drizzle schema and migrations
- Redis cache, distributed lock, queue, and scheduler bootstrap
- R2 as the default object storage provider, with OSS adapter boundaries
- Signed upload metadata persistence
- Invitation notification hooks with provider abstraction

## What Is Implemented

### Core foundation

- Typed config loading from `config/app.toml` plus environment overrides
- Feature flags for `auth`, `tenant`, `rbac`, `audit`, `storage`, `cache`, `queue`, `scheduler`, `payment`, and `notify`
- Module contracts for HTTP, worker, and scheduler registration
- Request security context middleware and permission helpers

### Auth and admin flows

- Better Auth server wiring
- Unified identifier routing for:
  - email + password
  - username + password
  - phone number + password
  - email OTP
  - phone OTP
- Admin user list and create endpoints
- OpenAPI coverage for admin user management routes

### Tenant and RBAC flows

- Tenant create and tenant list endpoints
- Tenant invitation create, list, revoke, lookup, and accept flows
- Tenant member list and deactivation
- Tenant role assign, revoke, catalog lookup, and member-role lookup
- RBAC seed script with baseline roles and permissions

### Infrastructure

- PostgreSQL client and Drizzle schema
- Redis-backed cache and lock infrastructure
- BullMQ queue bus and scheduler bootstrap
- Storage provider abstraction for R2 and OSS
- File metadata persistence when issuing signed upload URLs

## What Is Still a Placeholder

This repository already has the boundaries for these capabilities, but the production implementation is not finished yet:

- Real email provider integration beyond the current `stub` sender
- Real SMS provider integration
- WeChat Pay implementation
- Full invitation activation UX beyond the backend invitation API flow
- Advanced data-scope authorization policies

## Stack

- Bun
- Hono
- TypeScript
- Better Auth
- Drizzle ORM
- PostgreSQL
- Redis
- BullMQ
- Zod
- `@hono/zod-openapi`
- `@hono/swagger-ui`

## Project Structure

```text
src/
  app/
    bootstrap/
    http/
    scheduler/
    worker/
  infrastructure/
    auth/
    cache/
    db/
    lock/
    queue/
    redis/
  modules/
    auth/
    audit/
    notify/
    payment/
    rbac/
    storage/
    tenant/
  shared/
    config/
    errors/
    http/
```

## Getting Started

### Requirements

- Bun
- PostgreSQL
- Redis

### Install

```bash
bun install
```

### Configure

1. Copy environment values from `.env.example`
2. Review `config/app.toml`
3. Set the required env vars for the providers you enable

By default:

- `payment` is disabled
- `notify` is disabled
- `storage` uses `r2`
- `queue` uses `bullmq`

### Run database migrations

```bash
bun run db:migrate
```

### Seed RBAC defaults

```bash
bun run seed:rbac
```

### Start the API server

```bash
bun run dev
```

### Start the worker

```bash
bun run dev:worker
```

### Start the scheduler bootstrap

```bash
bun run dev:scheduler
```

## API Docs

Once the server is running:

- Swagger UI: `http://localhost:3000/docs`
- OpenAPI JSON: `http://localhost:3000/openapi.json`

## Examples

Practical examples live in [`examples/`](./examples/README.md).

- [`examples/http/auth-and-admin.sh`](./examples/http/auth-and-admin.sh)
- [`examples/http/tenant-invitation-flow.sh`](./examples/http/tenant-invitation-flow.sh)
- [`examples/http/storage-upload.sh`](./examples/http/storage-upload.sh)

For local development, some tenant-scoped examples use request headers to simulate security context:

- `x-principal-id`
- `x-tenant-id`
- `x-global-permissions`
- `x-tenant-permissions`

## Useful Scripts

```bash
bun run dev
bun run dev:worker
bun run dev:scheduler
bun run test
bun run typecheck
bun run db:generate
bun run db:migrate
bun run seed:rbac
```

## Testing

```bash
bun test
bun run typecheck
```
