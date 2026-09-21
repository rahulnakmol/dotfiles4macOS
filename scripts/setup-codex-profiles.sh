#!/usr/bin/env bash
# Install the pinned codex-profile launcher and configure subscription/gateway desktop routes.
set -euo pipefail

ROOT="${DOTFILES_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)}"
MODE=''
ACTION=install
PREFIX="${CODEX_PROFILE_PREFIX:-$HOME/.local}"
BIN_DIR="$PREFIX/bin"
PROFILE_BIN="$BIN_DIR/codex-profile"
STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/dotfiles/codex-profiles"
MODE_FILE="$STATE_DIR/mode"
PARKED_SUBSCRIPTION_HOME="$STATE_DIR/subscription-home"
PARKED_GATEWAY_HOME="$STATE_DIR/gateway-home"
DEFAULT_HOME="$HOME/.codex"
GATEWAY_HOME="$HOME/.codex-aigateway"
GATEWAY_CONFIG_DIR="$HOME/.config/private-ai-gateway"
PREPARED_GATEWAY_HOME="$GATEWAY_CONFIG_DIR/codex"
ACTIVE_CODEX_HOME_FILE="$GATEWAY_CONFIG_DIR/codex-home"
VERSION=1.2.0
COMMIT=d2260b800297a2b6441b3341c5c3ac48b67d59a1
SHA256="${CODEX_PROFILE_SHA256:-8b32679d8be7d44eaf424c9f1fdf971817226c35b155c33c0082f98243825a2a}"
DOWNLOAD_URL="${CODEX_PROFILE_DOWNLOAD_URL:-https://raw.githubusercontent.com/Ducksss/codex-profiles/$COMMIT/bin/codex-profile}"

usage() {
  echo 'Usage: scripts/setup-codex-profiles.sh [--mode subscription|gateway|both] [--status|--uninstall]'
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode) [[ $# -ge 2 ]] || { usage >&2; exit 2; }; MODE="$2"; shift 2 ;;
    --status) ACTION=status; shift ;;
    --uninstall) ACTION=uninstall; shift ;;
    -h|--help) usage; exit 0 ;;
    *) usage >&2; exit 2 ;;
  esac
done
if [[ -z "$MODE" && "$ACTION" == install ]]; then
  [[ -t 0 ]] || { echo 'Choose --mode subscription, gateway, or both.' >&2; exit 2; }
  echo 'Choose the Codex desktop mode:'
  select MODE in subscription gateway both; do [[ -n "$MODE" ]] && break; done
fi
if [[ -z "$MODE" && "$ACTION" == status && -s "$MODE_FILE" ]]; then MODE="$(cat "$MODE_FILE")"; fi
[[ -n "$MODE" ]] || MODE=unknown
case "$MODE" in subscription|gateway|both|unknown) ;; *) usage >&2; exit 2 ;; esac

write_launcher() {
  local destination="$1" profile="$2"
  cat >"$destination" <<EOF
#!/usr/bin/env bash
set -euo pipefail
unset CODEX_HOME CODEX_ACCESS_TOKEN CODEX_SQLITE_HOME CODEX_ELECTRON_USER_DATA_PATH CODEX_PROFILE_NAME
export CODEX_PROFILE_NO_UPDATE_CHECK=1
export PATH="\$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:\$PATH"
exec codex-profile app $profile "\$@"
EOF
  chmod 0700 "$destination"
}

configured_mode() {
  if [[ -s "$MODE_FILE" ]]; then cat "$MODE_FILE"; else echo unknown; fi
}

move_home() {
  local source="$1" destination="$2" label="$3"
  [[ -e "$source" || -L "$source" ]] || return 0
  [[ ! -e "$destination" && ! -L "$destination" ]] || {
    echo "Cannot preserve $label because $destination already exists." >&2
    exit 1
  }
  mkdir -p "$(dirname "$destination")"
  mv "$source" "$destination"
  echo "Preserved $label at $destination"
}

park_subscription() {
  move_home "$DEFAULT_HOME" "$PARKED_SUBSCRIPTION_HOME" 'the subscription Codex home'
}

restore_subscription() {
  move_home "$PARKED_SUBSCRIPTION_HOME" "$DEFAULT_HOME" 'the subscription Codex home'
}

park_gateway() {
  move_home "$GATEWAY_HOME" "$PARKED_GATEWAY_HOME" 'the gateway Codex home'
}

restore_gateway() {
  move_home "$PARKED_GATEWAY_HOME" "$GATEWAY_HOME" 'the gateway Codex home'
}

gateway_ready() {
  [[ -s "$GATEWAY_CONFIG_DIR/client.key" && -s "$PREPARED_GATEWAY_HOME/config.toml" ]]
}

require_gateway() {
  gateway_ready && return 0
  echo 'Gateway configuration is not prepared.' >&2
  if [[ -t 0 ]]; then
    local answer
    IFS= read -r -p 'Run the separate private AI gateway setup now? [y/N] ' answer
    if [[ "$answer" =~ ^[Yy]$ ]]; then
      bash "$ROOT/scripts/setup-private-ai-gateway.sh"
      gateway_ready && return 0
      echo 'Gateway setup did not produce a usable key and prepared Codex configuration.' >&2
      exit 1
    fi
  fi
  echo 'Run scripts/setup-private-ai-gateway.sh, resolve its connectivity/API checks, then rerun this command.' >&2
  exit 1
}

deploy_gateway_home() {
  local destination="$1" relative source target
  require_gateway
  install -d -m 0700 "$destination" "$destination/rules"
  for relative in config.toml AGENTS.md hooks.json keybindings.json rules/dotfiles.rules; do
    source="$PREPARED_GATEWAY_HOME/$relative"
    target="$destination/$relative"
    [[ -e "$source" || -L "$source" ]] || { echo "Prepared gateway file is missing: $source" >&2; exit 1; }
    rm -f "$target"
    ln -s "$source" "$target"
  done
}

activate_gateway_cli() {
  local home="$1"
  printf '%s\n' "$home" >"$ACTIVE_CODEX_HOME_FILE"
  chmod 0600 "$ACTIVE_CODEX_HOME_FILE"
}

install_herdr_codex() {
  local home="$1"
  command -v herdr >/dev/null 2>&1 || return 0
  CODEX_HOME="$home" herdr integration install codex >/dev/null
}

prepare_mode_homes() {
  local previous="$1"
  case "$MODE" in
    subscription)
      if [[ "$previous" == gateway ]]; then
        move_home "$DEFAULT_HOME" "$PARKED_GATEWAY_HOME" 'the gateway Codex home'
        restore_subscription
      elif [[ "$previous" == both ]]; then
        park_gateway
      fi
      if gateway_ready && [[ -x "$BIN_DIR/codex" ]]; then
        activate_gateway_cli "$PREPARED_GATEWAY_HOME"
      fi
      ;;
    gateway)
      require_gateway
      if [[ "$previous" == both ]]; then
        park_subscription
        move_home "$GATEWAY_HOME" "$DEFAULT_HOME" 'the gateway Codex home'
      elif [[ "$previous" != gateway ]]; then
        park_subscription
        if [[ -e "$GATEWAY_HOME" || -L "$GATEWAY_HOME" ]]; then
          move_home "$GATEWAY_HOME" "$DEFAULT_HOME" 'the gateway Codex home'
        elif [[ -e "$PARKED_GATEWAY_HOME" || -L "$PARKED_GATEWAY_HOME" ]]; then
          move_home "$PARKED_GATEWAY_HOME" "$DEFAULT_HOME" 'the gateway Codex home'
        fi
      fi
      deploy_gateway_home "$DEFAULT_HOME"
      activate_gateway_cli "$DEFAULT_HOME"
      ;;
    both)
      require_gateway
      if [[ "$previous" == gateway ]]; then
        move_home "$DEFAULT_HOME" "$GATEWAY_HOME" 'the gateway Codex home'
        restore_subscription
      elif [[ "$previous" == subscription ]]; then
        restore_gateway
      fi
      deploy_gateway_home "$GATEWAY_HOME"
      activate_gateway_cli "$GATEWAY_HOME"
      ;;
  esac
}

status() {
  local failed=0 item selected
  selected="$(configured_mode)"
  printf 'selected mode        %s\n' "$selected"
  if [[ -x "$PROFILE_BIN" ]] && [[ "$($PROFILE_BIN version 2>/dev/null)" == *"$VERSION"* ]]; then
    echo "codex-profile      pinned v$VERSION"
  else
    echo "codex-profile      absent or not pinned v$VERSION"
    failed=1
  fi
  for item in chatgpt-subscription chatgpt-aigateway; do
    if [[ -x "$BIN_DIR/$item" ]]; then
      printf '%-20s configured\n' "$item"
    elif [[ "$selected" == both || "$selected" == subscription && "$item" == chatgpt-subscription || "$selected" == gateway && "$item" == chatgpt-aigateway ]]; then
      printf '%-20s absent\n' "$item"
      failed=1
    else
      printf '%-20s not selected\n' "$item"
    fi
  done
  if [[ "$selected" == gateway || "$selected" == both ]]; then
    if gateway_ready; then echo 'gateway config       prepared'; else echo 'gateway config       absent'; failed=1; fi
  fi
  return "$failed"
}

if [[ "$ACTION" == status ]]; then status; exit; fi
[[ "$(uname -s)" == Darwin ]] || { echo 'Codex desktop profile setup supports macOS only.' >&2; exit 1; }
[[ "${EUID:-$(id -u)}" != 0 ]] || { echo 'Run as the signed-in macOS user, not with sudo.' >&2; exit 1; }

if [[ "$ACTION" == uninstall ]]; then
  rm -f "$BIN_DIR/chatgpt-subscription" "$BIN_DIR/chatgpt-aigateway"
  echo 'Removed profile launchers. Profile homes and codex-profile were retained for safe rollback.'
  exit 0
fi

install -d -m 0700 "$BIN_DIR" "$STATE_DIR"
PREVIOUS_MODE="$(configured_mode)"
case "$MODE" in gateway|both) require_gateway ;; esac
temporary="$(mktemp "${TMPDIR:-/tmp}/codex-profile.XXXXXX")"
trap 'rm -f "$temporary"' EXIT
curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 "$DOWNLOAD_URL" --output "$temporary"
actual="$(shasum -a 256 "$temporary" | awk '{print $1}')"
[[ "$actual" == "$SHA256" ]] || { echo 'codex-profile checksum mismatch; nothing installed.' >&2; exit 1; }
install -m 0755 "$temporary" "$PROFILE_BIN"
ln -sfn codex-profile "$BIN_DIR/codex-profiles"
"$PROFILE_BIN" version >/dev/null
prepare_mode_homes "$PREVIOUS_MODE"
rm -f "$BIN_DIR/chatgpt-subscription" "$BIN_DIR/chatgpt-aigateway"

case "$MODE" in
  subscription|both)
    bash "$ROOT/scripts/bootstrap-codex.sh" apply
    if command -v herdr >/dev/null 2>&1; then
      CODEX_HOME="$HOME/.codex" herdr integration install codex >/dev/null
    fi
    write_launcher "$BIN_DIR/chatgpt-subscription" default
    ;;
esac
case "$MODE" in
  gateway|both)
    if [[ "$MODE" == gateway ]]; then
      install_herdr_codex "$DEFAULT_HOME"
      write_launcher "$BIN_DIR/chatgpt-aigateway" default
    else
      install_herdr_codex "$GATEWAY_HOME"
      write_launcher "$BIN_DIR/chatgpt-aigateway" aigateway
    fi
    if [[ ! -x "$BIN_DIR/codex" ]]; then
      echo 'Codex CLI wrapper is unavailable because its client was not installed during gateway setup.'
      echo 'Install ChatGPT/Codex, then rerun scripts/setup-private-ai-gateway.sh; the desktop profile is still configured.'
    fi
    ;;
esac

printf '%s\n' "$MODE" >"$MODE_FILE"
chmod 0600 "$MODE_FILE"

echo "Configured Codex desktop mode: $MODE"
if [[ "$MODE" == subscription ]]; then
  if gateway_ready && [[ -x "$BIN_DIR/codex" ]]; then
    echo 'Terminal Codex remains gateway-backed; the subscription choice applies to the desktop profile.'
  else
    echo 'Terminal Codex uses the vendor default because private gateway setup has not been run.'
  fi
else
  echo 'Terminal Codex uses the selected gateway home.'
fi
status
