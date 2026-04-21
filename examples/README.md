# Examples

This folder contains copy-paste friendly examples for the current scaffold.

## Important note about request context

The project already has request security context middleware, but some admin and tenant flows are still demonstrated with request headers in development:

- `x-principal-id`
- `x-tenant-id`
- `x-global-permissions`
- `x-tenant-permissions`

These headers are useful for local examples and testing until the full session-derived authorization flow is tightened further.

## Files

- [`http/auth-and-admin.sh`](./http/auth-and-admin.sh): register, login, OTP request, and admin user management
- [`http/tenant-invitation-flow.sh`](./http/tenant-invitation-flow.sh): tenant creation, invitation flow, lookup, accept, and member/role inspection
- [`http/storage-upload.sh`](./http/storage-upload.sh): signed upload URL generation and object upload example

