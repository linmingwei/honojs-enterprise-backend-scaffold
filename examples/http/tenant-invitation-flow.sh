#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
TENANT_ID="${TENANT_ID:-tenant-id-from-create-response}"
INVITE_TOKEN="${INVITE_TOKEN:-invite-token-from-email-or-log}"
CURRENT_USER_ID="${CURRENT_USER_ID:-user-accepted-invite}"

echo "== Create a tenant =="
curl -sS -X POST "$BASE_URL/api/admin/tenants" \
  -H "content-type: application/json" \
  -d '{
    "name": "Acme Corp",
    "slug": "acme-corp"
  }'
echo
echo

echo "== Create an invitation =="
curl -sS -X POST "$BASE_URL/api/admin/tenants/$TENANT_ID/invitations" \
  -H "content-type: application/json" \
  -d '{
    "email": "member@example.com",
    "invitedByUserId": "admin-user-id"
  }'
echo
echo

cat <<'NOTE'
Set INVITE_TOKEN from the invitation lookup URL or the stub email sender output.
With notify enabled and emailProvider=stub, the scaffold logs the invitation payload.
NOTE
echo

echo "== Lookup the invitation =="
curl -sS "$BASE_URL/api/public/tenant-invitations/$INVITE_TOKEN"
echo
echo

echo "== Accept the invitation as the current principal =="
curl -sS -X POST "$BASE_URL/api/tenant-invitations/$INVITE_TOKEN/accept" \
  -H "x-principal-id: $CURRENT_USER_ID"
echo
echo

echo "== List tenant members =="
curl -sS "$BASE_URL/api/admin/tenants/$TENANT_ID/members"
echo
echo

echo "== List tenant role catalog =="
curl -sS "$BASE_URL/api/admin/tenants/$TENANT_ID/roles"
echo
echo

echo "== Assign a role =="
curl -sS -X POST "$BASE_URL/api/admin/tenants/$TENANT_ID/roles/assign" \
  -H "content-type: application/json" \
  -d "{
    \"userId\": \"$CURRENT_USER_ID\",
    \"roleId\": \"tenant-role-id\"
  }"
echo

