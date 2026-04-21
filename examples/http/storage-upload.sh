#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
TENANT_ID="${TENANT_ID:-tenant-id}"
PRINCIPAL_ID="${PRINCIPAL_ID:-user-id}"
OBJECT_KEY="${OBJECT_KEY:-uploads/demo.txt}"
FILE_PATH="${FILE_PATH:-./demo.txt}"

echo "== Request a signed upload URL =="
curl -sS -X POST "$BASE_URL/api/admin/storage/sign-upload" \
  -H "content-type: application/json" \
  -H "x-tenant-id: $TENANT_ID" \
  -H "x-principal-id: $PRINCIPAL_ID" \
  -d "{
    \"key\": \"$OBJECT_KEY\",
    \"contentType\": \"text/plain\",
    \"size\": 12
  }"
echo
echo

cat <<'NOTE'
The response contains:
- id: persisted file metadata ID
- url: signed upload URL

Use the returned URL to upload the file, for example:

curl -X PUT "<signed-url>" \
  -H "content-type: text/plain" \
  --data-binary @"$FILE_PATH"
NOTE

