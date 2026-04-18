# Hono Enterprise Backend Scaffold Design

**Date:** 2026-04-19
**Status:** Draft for review
**Chosen approach:** Hybrid modular monolith

## Goal

Build a Hono.js backend scaffold that runs on Bun and provides an enterprise-ready foundation with:

- PostgreSQL + Drizzle ORM
- Better Auth based identity and session management
- Unified login with email / username / phone + password
- Email OTP and phone OTP login
- Tenant-aware RBAC
- Swagger / OpenAPI
- Redis-based cache, locking, and async task infrastructure
- BullMQ-based queues and schedulers
- R2 as the default object storage provider with OSS as a pluggable alternative
- Feature switches so optional modules are only activated when enabled
- Reserved extension points for WeChat Pay, notifications, and other enterprise capabilities

## Scope

This specification covers the first delivery slice, labeled `A`.

Included in this slice:

- Core Hono + Bun application skeleton
- Authentication foundation
- Tenant model and RBAC foundation
- OpenAPI / Swagger
- Redis infrastructure
- BullMQ queue and scheduler foundation
- R2 upload implementation
- OSS adapter interface and configuration section
- Feature-flagged module system
- Strongly typed configuration system
- Audit logging foundation
- Provider interfaces for future integrations

Reserved but not implemented in this slice:

- WeChat Pay concrete implementation
- SMS and email vendor implementations
- Fine-grained data-scope policies
- Advanced multi-tenant operations
- Full notification center

## Non-Goals

- Implementing a complete payment domain in this slice
- Implementing a complete messaging center in this slice
- Supporting every storage or cache vendor from day one
- Building separate microservices
- Allowing public registration for admin users

## Architecture Summary

The scaffold uses a single repository and a single logical Hono service, but with multiple runtime entrypoints:

- `api`: HTTP server for public, admin, auth, docs, and internal routes
- `worker`: BullMQ workers for async jobs
- `scheduler-bootstrap`: startup process that registers recurring jobs

This is not a microservice split. It is a modular monolith with separate process roles for operational clarity.

The system is layered around domain boundaries and infrastructure ports:

- Modules own their domain logic, HTTP routes, persistence mappings, task definitions, and permission codes
- Infrastructure implementations live behind explicit ports
- Application code depends on ports, not vendor SDKs

## Chosen Technical Direction

- Runtime: Bun
- Web framework: Hono
- Route schema and OpenAPI: `@hono/zod-openapi`
- Swagger UI: `@hono/swagger-ui`
- Auth core: Better Auth
- ORM: Drizzle
- Database: PostgreSQL
- Redis infra: Redis
- Queue and scheduled jobs: BullMQ
- Default object storage: Cloudflare R2 via S3-compatible API
- Alternate object storage: Aliyun OSS adapter

### Database Driver Choice

The runtime remains Bun, but the default PostgreSQL driver should be one of Drizzle's established PostgreSQL drivers rather than Bun SQL. This keeps the scaffold aligned with the more mature Drizzle PostgreSQL path and avoids making Bun SQL a foundational dependency for the first release.

## Module System and Feature Switches

The application will use a module registry. Every module declares:

- module id
- dependencies
- default enabled state
- config schema
- route registration hooks
- worker registration hooks
- scheduler registration hooks
- provider factory hooks

Feature switches are split into two layers:

1. `features.<module>.enabled`
2. `providers.<capability>`

Examples:

- `features.storage.enabled = true`
- `features.queue.enabled = true`
- `providers.storage = "r2"`
- `providers.queue = "bullmq"`

Core modules remain always enabled:

- auth
- tenant
- rbac
- openapi
- audit

Optional modules are controlled by feature switches:

- storage
- cache
- queue
- scheduler
- payment
- notify

When a module is disabled:

- its routes are not mounted
- its workers are not registered
- its recurring jobs are not registered
- its provider is not constructed
- its OpenAPI paths are not exposed
- only the config required by enabled modules is validated

## Route Topology

The HTTP surface is split into four route groups:

- `/api/auth/*`
- `/api/public/*`
- `/api/admin/*`
- `/api/internal/*`

Responsibilities:

- `auth`: Better Auth endpoints and the facade endpoints for unified login
- `public`: normal end-user application APIs
- `admin`: back-office administration APIs
- `internal`: webhooks, system callbacks, task control, and health-oriented internal endpoints

Swagger UI is exposed at `/docs`.

## Identity and Authentication Model

There is one identity system and one principal type. The scaffold does not split administrators and ordinary users into separate user tables.

Administrators are ordinary users with elevated global permissions.

Better Auth is used for:

- password-based authentication
- OTP-based authentication
- sessions
- verification flows
- user management helpers
- admin-side identity operations

An internal auth facade will normalize the external API so clients can call a unified login interface while the implementation can route internally by identifier type.

Supported login methods:

- email + password
- username + password
- phone + password
- email OTP
- phone OTP

## User Lifecycle Rules

The user lifecycle rules are:

- ordinary users may register publicly
- admin users may not register publicly
- admin users must be created or invited by an existing high-privilege admin
- ordinary users who self-register do not automatically create a tenant
- ordinary users who self-register do not gain admin-console access
- tenant access must come from invitation, assignment, or explicit binding

This avoids conflicts between public registration and the enterprise tenant model.

## Tenant and RBAC Model

Authorization is split into two levels:

- global authorization
- tenant-scoped authorization

Global authorization governs system-wide capabilities such as:

- admin-console access
- tenant creation approval
- global user administration
- provider configuration management

Tenant-scoped authorization governs organization-local capabilities such as:

- member invitation
- role assignment
- file management
- module-specific actions within the tenant

The RBAC model is:

- roles map to permission codes
- permission codes are stable strings
- menu visibility, API protection, and action control all reference permission codes

Examples:

- `user.read`
- `user.create`
- `tenant.member.invite`
- `storage.file.upload`

Data-scope authorization is explicitly deferred. The request context will reserve room for it so future policies can be added without redesigning the middleware contract.

## Request Context Contract

Every authenticated request resolves a security context containing:

- principal
- current tenant
- global roles
- tenant roles
- global permissions
- tenant permissions

Hono middleware is responsible for:

- recovering identity
- resolving tenant context
- attaching permission context

Business modules check permissions through the normalized context rather than calling Better Auth APIs directly in each handler.

## Object Storage Design

Object storage is abstracted behind `ObjectStorageAdapter` with a stable interface:

- `put`
- `get`
- `delete`
- `signUpload`
- `signDownload`

Default provider:

- Cloudflare R2

Alternate provider:

- Aliyun OSS

Business modules never directly import vendor SDKs.

The system will also persist upload metadata in PostgreSQL. The scaffold includes a `files` table to capture:

- tenant id
- uploader id
- provider
- bucket
- object key
- mime type
- file size
- checksum
- visibility

## Redis, Locking, Queueing, and Scheduling

Redis-backed infrastructure is separated into three ports:

- `CacheStore`
- `LockManager`
- `QueueBus`

This keeps caching, locking, and queue responsibilities independent even when they use the same underlying Redis deployment.

BullMQ is the unified task substrate for:

- normal async jobs
- delayed jobs
- retries
- dead-letter handling
- recurring jobs

Recurring jobs are registered through a scheduler port during bootstrap rather than being scattered as ad hoc cron definitions throughout modules.

## Provider Abstraction Boundary

The scaffold reserves interfaces for future enterprise integrations:

- `PaymentProvider`
- `SmsSender`
- `EmailSender`
- `WebhookVerifier`

In slice `A`, only the interfaces and configuration sections are included. No concrete WeChat Pay implementation is shipped yet.

## Configuration Shape

Configuration is strongly typed and grouped by concern:

- `features.*`
- `providers.*`
- `auth.*`
- `db.*`
- `redis.*`
- `storage.*`
- `queue.*`
- `scheduler.*`
- `payment.*`
- `notify.*`

Example shape:

```toml
[features.auth]
enabled = true

[features.storage]
enabled = true

[features.queue]
enabled = true

[features.payment]
enabled = false

[providers]
storage = "r2"
queue = "bullmq"
cache = "redis"

[storage.r2]
bucket = ""
endpoint = ""
access_key_id = ""
secret_access_key = ""

[storage.oss]
region = ""
bucket = ""
access_key_id = ""
access_key_secret = ""
```

Disabled modules may keep inactive config sections, but startup validation only enforces the config required by enabled modules.

## Proposed Directory Shape

```text
src/
  app/
    bootstrap/
    http/
    worker/
    scheduler/
  modules/
    auth/
    tenant/
    rbac/
    user/
    audit/
    storage/
    queue/
    scheduler/
    payment/
    notify/
  infrastructure/
    db/
    redis/
    storage/
    queue/
    cache/
    lock/
    auth/
    payment/
    notify/
  shared/
    config/
    errors/
    logger/
    types/
    utils/
```

Each module internally owns focused files grouped by its own domain concerns, typically along lines such as:

- `domain`
- `application`
- `http`
- `persistence`
- `config`

## Database Model

The data model contains two broad categories:

1. Better Auth identity tables
2. Business-domain tables

Planned business-domain tables include:

- `tenants`
- `tenant_memberships`
- `roles`
- `permissions`
- `role_permissions`
- `user_global_roles`
- `user_tenant_roles`
- `menus`
- `api_policies`
- `audit_logs`
- `files`
- `module_settings`
- `idempotency_records`

This keeps business authorization and operational metadata under application control rather than forcing them into plugin-managed auth tables.

## Testing Strategy

The scaffold will prioritize tests around the highest-risk integration points:

- config and module-registry unit tests
- auth and RBAC domain tests
- storage adapter tests
- queue and scheduler tests
- Hono route and OpenAPI integration tests
- PostgreSQL + Redis smoke tests

The initial focus is to lock down:

- module enable / disable behavior
- permission context construction
- upload adapter behavior
- queue registration behavior
- route exposure and docs exposure

## Delivery Boundary for Slice A

The first implementation slice must deliver:

- Hono + Bun app skeleton
- Better Auth integration
- unified login facade
- tenant model
- RBAC foundation
- OpenAPI and Swagger
- Redis infrastructure
- BullMQ foundation
- R2 upload implementation
- OSS adapter interface
- module registry with feature switches
- typed configuration system
- audit logging foundation

The first implementation slice must not attempt to fully implement:

- WeChat Pay
- complete notification infrastructure
- advanced data-scope policies
- high-complexity multi-tenant operations

## Key Assumptions

- Public registration exists only for ordinary users
- Self-registered users start without tenant management privileges
- Admin identities are created or invited only by privileged admins
- Core modules are always enabled
- Optional enterprise capabilities are feature-gated
- R2 is the default storage implementation in the first slice
- OSS and WeChat Pay are extension points in the first slice

## Risks and Mitigations

- Risk: auth and authorization boundaries become coupled
- Mitigation: keep Better Auth focused on identity; keep business RBAC in application tables and middleware contracts

- Risk: feature flags become shallow and only hide UI
- Mitigation: disabled modules must not mount routes, jobs, docs, or providers

- Risk: queueing, locking, and caching collapse into a shared utility mess
- Mitigation: define separate ports with independent tests and implementations

- Risk: tenant modeling becomes inconsistent between public and admin flows
- Mitigation: keep self-registration tenant-neutral and require explicit tenant binding

## Acceptance Criteria for the Design

This design is acceptable when:

- the scaffold can boot with only core modules enabled
- enabling storage mounts storage routes and validates storage config
- disabling storage removes storage routes and docs exposure
- a self-registered user cannot access admin APIs without global permissions
- tenant-scoped APIs can enforce permission-code checks through request context
- queue and scheduler functionality can be enabled without leaking BullMQ details into business modules
- storage provider selection can switch from R2 to OSS without changing business use cases
