#!/usr/bin/env bash
set -euo pipefail
echo "Seeding validators…"
node -e "require('tsx').default('./tools/seed-validators.ts')" || node --loader tsx ./tools/seed-validators.ts
echo "Seeding fields…"
node -e "require('tsx').default('./tools/seed-fields.ts')" || node --loader tsx ./tools/seed-fields.ts
echo "✅ Done."
