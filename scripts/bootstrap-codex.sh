#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
if [[ "$(uname -s)" != Darwin ]]; then
  echo 'Codex dotfiles currently support macOS only.' >&2
  exit 1
fi
RUNTIME="${XDG_DATA_HOME:-$HOME/.local/share}/dotfiles/codex-runtime"
if [[ ! -x "$RUNTIME/bin/python" ]]; then
  python3 -m venv "$RUNTIME"
fi
if ! "$RUNTIME/bin/python" -c 'import tomlkit; assert tomlkit.__version__ == "0.13.3"' 2>/dev/null; then
  "$RUNTIME/bin/python" -m pip install --disable-pip-version-check -r "$ROOT/scripts/codex-requirements.txt"
fi
exec "$RUNTIME/bin/python" "$ROOT/scripts/codex-config.py" "$@"
