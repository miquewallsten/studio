#!/usr/bin/env bash
set -euo pipefail
base="http://localhost:3000"
echo "HEALTH _health:"; curl -s "$base/api/_health"; echo
echo "HEALTH admin:";   curl -s "$base/api/admin/health"; echo
echo "HEALTH ai:";      curl -s "$base/api/ai/health"; echo
