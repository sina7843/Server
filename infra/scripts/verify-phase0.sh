#!/usr/bin/env bash
# Phase 0 verification script
# Runs all automated checks required for the Phase 0 release gate.
#
# Requirements:
#   - pnpm installed and dependencies installed (pnpm install)
#   - Node.js >= 20
#   - Docker is NOT required for this script (image builds are a separate manual step)
#
# Usage:
#   bash infra/scripts/verify-phase0.sh
#   pnpm verify:phase0

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

PASS=0
FAIL=0

run_check() {
  local label="$1"
  shift
  echo ""
  echo "──────────────────────────────────────────"
  echo "CHECK: $label"
  echo "CMD:   $*"
  echo "──────────────────────────────────────────"
  if "$@"; then
    echo "RESULT: PASS — $label"
    PASS=$((PASS + 1))
  else
    echo "RESULT: FAIL — $label"
    FAIL=$((FAIL + 1))
  fi
}

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Dragon Ecosystem — Phase 0 Verify     ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Working directory: $ROOT_DIR"

# ─── Workspace-level checks ─────────────────────────────────────────────────

run_check "Lint (all packages)"       pnpm lint
run_check "Typecheck (all packages)"  pnpm typecheck
run_check "Build (all packages)"      pnpm build
run_check "Format check"              pnpm format:check

# ─── Unit tests (API only — the only package with test suite) ───────────────

run_check "Unit tests (api)"          pnpm --filter @dragon/api test

# ─── Smoke tests (api, no real services required) ───────────────────────────

run_check "Smoke tests (api)"         pnpm smoke

# ─── Docker Compose config validation (no Docker daemon required) ────────────

if command -v docker &>/dev/null; then
  run_check "Docker compose — local config"  \
    docker compose -f infra/docker/docker-compose.local.yml config --quiet
  run_check "Docker compose — prod config"   \
    docker compose -f infra/docker/docker-compose.prod.yml \
      --env-file infra/docker/.env.production.example config --quiet
else
  echo ""
  echo "SKIP: Docker is not available — compose config checks skipped"
  echo "      Run manually when Docker is available:"
  echo "      docker compose -f infra/docker/docker-compose.local.yml config"
  echo "      docker compose -f infra/docker/docker-compose.prod.yml --env-file infra/docker/.env.production.example config"
fi

# ─── Summary ────────────────────────────────────────────────────────────────

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   Phase 0 Verification Summary          ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "  PASS: $PASS"
echo "  FAIL: $FAIL"
echo ""

if [ "$FAIL" -gt 0 ]; then
  echo "  STATUS: FAILED — $FAIL check(s) did not pass."
  echo "  Do not declare Phase 0 complete until all checks pass."
  echo ""
  exit 1
else
  echo "  STATUS: ALL AUTOMATED CHECKS PASSED"
  echo ""
  echo "  Remaining manual gates (not covered by this script):"
  echo "  - Docker image builds (docker build -f apps/api/Dockerfile -t dragon-api:test .)"
  echo "  - Manual QA checklist: docs/operations/manual-qa-checklist.md"
  echo "  - Phase 0 security checklist: docs/security/phase-0-security-checklist.md"
  echo "  - Production readiness checklist: docs/operations/production-readiness-checklist.md"
  echo "  - Backup/restore verification (requires live Object Storage)"
  echo ""
  exit 0
fi
