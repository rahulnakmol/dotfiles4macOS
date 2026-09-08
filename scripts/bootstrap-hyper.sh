#!/bin/bash
set -euo pipefail
script_dir="$(cd -- "$(dirname -- "$0")" && pwd)"
if [[ "$(uname -s)" != Darwin ]]; then
  echo 'Hyper setup supports macOS only.' >&2; exit 1
fi
# plan/check never install dependencies. A fresh Mac needs Homebrew first.
if ! command -v node >/dev/null 2>&1; then
  if [[ "${1:-plan}" == apply ]] && command -v brew >/dev/null 2>&1; then
    brew install node
  else
    echo 'Install Homebrew (brew.sh), then brew install node git stow; rerun this command.' >&2
    exit 1
  fi
fi
exec node "$script_dir/bootstrap-hyper.mjs" "$@"
