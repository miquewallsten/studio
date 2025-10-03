
#!/usr/bin/env bash
set -euo pipefail
echo "✅ Running pre-flight checks..."

echo "  - Checking client Firestore imports..."
CLIENT_FILES=$(grep -R --include='*.tsx' --include='*.ts' -n "use client" src | cut -d: -f1 | sort -u || true)
LEAKS=$( (for f in $CLIENT_FILES; do
  grep -nE "from ['\"](@?firebase/|firebase/)" "$f" || true
done) | sed '/^$/d' || true)
if [ -n "${LEAKS:-}" ]; then
  echo "❌ FAILED: Client files importing firebase/@firebase:"
  echo "$LEAKS"
  exit 1
fi
echo "  ✅ PASSED: No client firebase imports."

echo "  - RBAC checks..."
MISSING_AUTH=$(grep -R "export async function \\(GET\\|POST\\|PATCH\\|DELETE\\)" -l src/app/api | grep -vE "_health|_instance|_diag|send-email" | xargs -I {} grep -L "requireAuth" {} || true)
if [ -n "$MISSING_AUTH" ]; then
  echo "❌ FAILED: API routes missing requireAuth():"
  echo "$MISSING_AUTH"; exit 1
fi
echo "  ✅ PASSED: RBAC coverage ok."
