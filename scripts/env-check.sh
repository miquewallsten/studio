#!/usr/bin/env bash
set -euo pipefail
s() { [ -n "${!1:-}" ] && echo "$1=SET" || echo "$1="; }
echo "AI_ENABLED=${AI_ENABLED:-}"
echo "$(s GOOGLE_API_KEY)"
echo "Cred sources -> FILE:${GOOGLE_APPLICATION_CREDENTIALS:+1}${GOOGLE_APPLICATION_CREDENTIALS:-0}  B64:${FIREBASE_SERVICE_ACCOUNT_B64:+1}${FIREBASE_SERVICE_ACCOUNT_B64:-0}  TRIPLET:$([ -n "${FIREBASE_PROJECT_ID:-}" ] && [ -n "${FIREBASE_CLIENT_EMAIL:-}" ] && [ -n "${FIREBASE_PRIVATE_KEY:-}" ] && echo 1 || echo 0)"
exit 0
