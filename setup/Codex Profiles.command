#!/bin/bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
exec /bin/bash "$ROOT/scripts/setup-codex-profiles.sh" "$@"
