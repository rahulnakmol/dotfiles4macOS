#!/bin/bash
set -euo pipefail
script_dir="$(cd -- "$(dirname -- "$0")" && pwd)"
if [[ "$(uname -s)" != Darwin ]]; then echo 'FDE and TF support macOS only.' >&2; exit 1; fi
if ! command -v node >/dev/null; then
  echo 'Install prerequisites: brew install git node stow' >&2; exit 1
fi
exec node "$script_dir/setup-workstation.mjs" "$@"
