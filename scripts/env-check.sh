#!/usr/bin/env bash
set -euo pipefail
node -e "const e=process.env;const L=s=>s?s.length:0;console.log('AI_ENABLED=',e.AI_ENABLED||'');console.log('GOOGLE_API_KEY_LEN=',L(e.GOOGLE_API_KEY));console.log('B64_LEN=',L(e.FIREBASE_SERVICE_ACCOUNT_B64));"
