#!/usr/bin/env bash
set -euo pipefail
base="http://localhost:3000"
echo "HEALTH _health:"; curl -fsS "$base/api/_health"; echo
echo "HEALTH admin:";   curl -fsS "$base/api/admin/health"; echo
echo "HEALTH ai:";      curl -fsS "$base/api/ai/health"; echo
