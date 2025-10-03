#!/usr/bin/env bash
set -euo pipefail
echo -n "HEALTH _health: "
curl -s http://localhost:9002/api/_health
echo
echo -n "HEALTH instance: "
curl -s http://localhost:9002/api/_instance
echo
echo -n "HEALTH ai: "
curl -s http://localhost:9002/api/ai/health
echo
