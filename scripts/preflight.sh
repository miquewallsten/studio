#!/usr/bin/env bash
set -euo pipefail

echo "✅ Running pre-flight checks..."

echo "   - Checking for server-only logic leaked to client components..."
# This command should produce no output. If it does, the script will fail.
LEAKS=$(grep -R "use client" -l src/app | xargs -I {} grep -nE "firebase/firestore|@firebase/firestore|firebase-admin|getAdminAuth|getAdminDb|from '@google/generative-ai'" {} || true)
if [ -n "$LEAKS" ]; then
  echo "❌ FAILED: Found server-only logic in client components:"
  echo "$LEAKS"
  exit 1
fi
echo "   ✅ PASSED: No server-only logic leaks found."


echo "   - Checking for API routes missing RBAC..."
# This command should produce no output.
# It checks for API routes (GET, POST, etc.) that are NOT health checks and are missing the `requireAuth` call.
MISSING_RBAC=$(grep -R "export async function \\(GET\\|POST\\|PATCH\\|DELETE\\)" -l src/app/api | grep -vE "_health|_instance|send-email" | xargs -I {} grep -L "requireAuth" {} || true)
if [ -n "$MISSING_RBAC" ]; then
    echo "❌ FAILED: Found API routes missing requireAuth():"
    echo "$MISSING_RBAC"
    exit 1
fi
echo "   ✅ PASSED: All sensitive API routes have authentication checks."

echo "✅ All pre-flight checks passed."
