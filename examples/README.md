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
