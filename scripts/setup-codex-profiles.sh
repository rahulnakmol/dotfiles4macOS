#!/usr/bin/env bash
# Configure the supported Codex split: subscription desktop, gateway CLI.
set -euo pipefail

ROOT="${DOTFILES_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)}"
GATEWAY_DIR="$HOME/.config/private-ai-gateway"
GATEWAY_HOME="$GATEWAY_DIR/codex"
ACTIVE_CODEX_HOME_FILE="$GATEWAY_DIR/codex-home"
ACTION=setup

usage() {
  echo 'Usage: scripts/setup-codex-profiles.sh [--status | --cleanup]'
  echo 'The desktop app uses the normal subscription home; terminal codex uses the private gateway.'
}

case "${1:-}" in
  '') ;;
  --status) ACTION=status ;;
  --cleanup) ACTION=cleanup ;;
  --mode)
    echo 'Gateway and multi-profile desktop modes are retired after end-to-end testing.' >&2
    echo 'Run this command without --mode to configure subscription desktop + gateway CLI.' >&2
    exit 2
    ;;
  -h|--help) usage; exit 0 ;;
  *) usage >&2; exit 2 ;;
esac
[[ $# -le 1 ]] || { usage >&2; exit 2; }

status() {
  local failed=0
  if [[ -s "$GATEWAY_DIR/client.key" && -s "$GATEWAY_HOME/config.toml" ]]; then
    echo 'terminal codex       gateway prepared'
  else
    echo 'terminal codex       gateway absent'
    failed=1
  fi
  if [[ -s "$ACTIVE_CODEX_HOME_FILE" && "$(<"$ACTIVE_CODEX_HOME_FILE")" == "$GATEWAY_HOME" ]]; then
    echo "terminal CODEX_HOME  $GATEWAY_HOME"
  else
    echo 'terminal CODEX_HOME  not set to the isolated gateway home'
    failed=1
  fi
  if [[ -d "$HOME/.codex" ]]; then echo 'desktop codex        subscription home present'; else echo 'desktop codex        subscription home absent'; failed=1; fi
  if [[ -e "$HOME/.codex-aigateway" || -L "$HOME/.codex-aigateway" ]]; then
    echo 'legacy gateway app   still active; run --cleanup'
    failed=1
  else
    echo 'legacy gateway app   inactive'
  fi
  return "$failed"
}

if [[ "$ACTION" == status ]]; then status; exit; fi
[[ "$(uname -s)" == Darwin ]] || { echo 'Codex setup supports macOS only.' >&2; exit 1; }
[[ "${EUID:-$(id -u)}" != 0 ]] || { echo 'Run as the signed-in macOS user, not with sudo.' >&2; exit 1; }

if [[ "$ACTION" == cleanup ]]; then
  exec /bin/bash "$ROOT/scripts/cleanup-codex-profiles.sh"
fi

if [[ ! -s "$GATEWAY_DIR/client.key" || ! -s "$GATEWAY_HOME/config.toml" ]]; then
  echo 'The private gateway must be prepared for terminal Codex.' >&2
  if [[ -t 0 ]]; then
    IFS= read -r -p 'Run private AI gateway setup now? [y/N] ' answer
    if [[ "$answer" =~ ^[Yy]$ ]]; then
      /bin/bash "$ROOT/scripts/setup-private-ai-gateway.sh"
    fi
  fi
fi
[[ -s "$GATEWAY_DIR/client.key" && -s "$GATEWAY_HOME/config.toml" ]] || {
  echo 'Run scripts/setup-private-ai-gateway.sh successfully, then rerun this command.' >&2
  exit 1
}

/bin/bash "$ROOT/scripts/cleanup-codex-profiles.sh"
printf '%s\n' "$GATEWAY_HOME" >"$ACTIVE_CODEX_HOME_FILE"
chmod 0600 "$ACTIVE_CODEX_HOME_FILE"

if command -v herdr >/dev/null 2>&1; then
  CODEX_HOME="$GATEWAY_HOME" herdr integration install codex >/dev/null
fi

cat <<EOF

Codex is configured with one supported boundary:
  Desktop app: $HOME/.codex (normal ChatGPT subscription login)
  Terminal CLI: $GATEWAY_HOME (private AI gateway)

Launch the desktop app normally from Dock, Spotlight, Raycast, or:
  open -a ChatGPT

Refresh gateway models now:
  bash scripts/setup-private-ai-gateway.sh --refresh

Enable a daily macOS refresh:
  bash scripts/setup-private-ai-gateway.sh --install-refresh
EOF
status
