#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

echo "== Register a public user =="
curl -sS -X POST "$BASE_URL/api/auth/register" \
  -H "content-type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "P@ssw0rd123",
    "name": "Example User",
    "username": "example-user"
  }'
echo
echo

echo "== Password login with email / username / phone =="
curl -sS -X POST "$BASE_URL/api/auth/unified-login" \
  -H "content-type: application/json" \
  -d '{
    "identifier": "example-user",
    "password": "P@ssw0rd123"
  }'
echo
echo

echo "== Request OTP login code =="
curl -sS -X POST "$BASE_URL/api/auth/request-otp" \
  -H "content-type: application/json" \
  -d '{
    "identifier": "user@example.com"
  }'
echo
echo

echo "== Create an admin user =="
curl -sS -X POST "$BASE_URL/api/admin/users" \
  -H "content-type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "P@ssw0rd123",
    "name": "Platform Admin",
    "role": "admin"
  }'
echo
echo

echo "== List admin users =="
curl -sS "$BASE_URL/api/admin/users?limit=20"
echo

