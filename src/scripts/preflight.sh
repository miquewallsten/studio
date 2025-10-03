
#!/usr/bin/env bash
set -euo pipefail
echo "✅ Running pre-flight checks..."

echo "  - Checking client Firestore imports..."
# This command is a bit complex. It first finds all files with "use client",
# then greps inside those files for firebase/firestore or firebase/app imports.
# The '|| true' ensures that the script doesn't exit if grep finds no matches.
CLIENT_FILES=$(grep -R --include='*.tsx' --include='*.ts' -n "use client" src | cut -d: -f1 | sort -u || true)
LEAKS=""
if [ -n "$CLIENT_FILES" ]; then
    LEAKS=$( (for f in $CLIENT_FILES; do
      # We are now blocking both firestore and app, as client should only use auth.
      # This regex ensures we only match 'firebase/...' and NOT 'firebase-admin/...'
      grep -nE "from ['\"](firebase/app|firebase/firestore)['\"]" "$f" || true
    done) | sed '/^$/d' || true)
fi

if [ -n "${LEAKS:-}" ]; then
  echo "❌ FAILED: Client files are not allowed to import firebase/app or firebase/firestore:"
  echo "$LEAKS"
  echo "All data access must go through server-side API routes using useSecureFetch."
  exit 1
fi
echo "  ✅ PASSED: No forbidden client-side Firebase imports found."


echo "  - RBAC checks..."
# Find all API route handlers (GET, POST, etc.) and check if they call requireAuth.
# We exclude some public health/diagnostic endpoints.
MISSING_AUTH=$(grep -R "export async function \\(GET\\|POST\\|PATCH\\|DELETE\\)" -l src/app/api | grep -vE "_health|_instance|_diag|send-email|onboard" | xargs -I {} grep -L "requireAuth" {} || true)
if [ -n "$MISSING_AUTH" ]; then
  echo "❌ FAILED: The following API routes are missing a call to requireAuth():"
  echo "$MISSING_AUTH"; exit 1
fi
echo "  ✅ PASSED: RBAC coverage looks OK."
