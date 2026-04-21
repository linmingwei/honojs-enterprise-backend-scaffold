# Examples

This folder focuses on how to write business code on top of the scaffold.

These examples are not runtime modules wired into the app by default. They are reference implementations that follow the same conventions as the repository:

- schema and persistence near the module
- application services for orchestration
- Hono OpenAPI routes for HTTP exposure
- RBAC permission checks at the route boundary
- Queue and storage abstractions used from business code instead of vendor SDKs directly

## Files

- [`business/catalog-module.example.ts`](./business/catalog-module.example.ts)
  A tenant-scoped business module example with schema, list/create routes, and permission checks.
- [`business/catalog-jobs.example.ts`](./business/catalog-jobs.example.ts)
  Examples of enqueueing background work and registering a scheduler for business jobs.
- [`business/catalog-assets.example.ts`](./business/catalog-assets.example.ts)
  An example of linking uploaded files to business entities after the storage module returns a file ID.
- [`business/async-task.example.ts`](./business/async-task.example.ts)
  Examples of how to enqueue async business work and register recurring tasks.
- [`business/locks-and-cache.example.ts`](./business/locks-and-cache.example.ts)
  Examples of cache-aside reads and distributed lock usage.
- [`business/email-template.example.ts`](./business/email-template.example.ts)
  A practical way to define and render typed email templates on top of the EmailSender abstraction.
