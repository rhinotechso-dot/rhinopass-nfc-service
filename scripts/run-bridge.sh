#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [ -f "$REPO_DIR/.env" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$REPO_DIR/.env"
  set +a
fi

exec node "$REPO_DIR/dist/index.js"
