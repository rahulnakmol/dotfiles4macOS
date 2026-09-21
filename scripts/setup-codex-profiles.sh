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
LOCK_DIR="$STATE_DIR/setup.lock"
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

print_journey() {
  cat <<EOF
Codex desktop profile setup — selected mode: $MODE

This command runs each prerequisite in order; do not run Stow in another terminal:
  1. Confirm the separately validated gateway key and prepared Codex provider exist.
     The terminal Codex CLI is always gateway-backed in every desktop mode.
  2. Acquire a per-user setup lock so two profile changes cannot move ~/.codex at once.
  3. Move or restore isolated Codex homes for '$MODE'. Inactive homes are parked,
     never merged or deleted.
  4. For subscription or both mode, run the reviewed Codex Stow migration and wait
     until every managed file is linked before creating launchers.
  5. Install the pinned codex-profile launcher and print every active/generated path.

Gateway authentication remains a separate journey. If it is missing, this command
offers to run scripts/setup-private-ai-gateway.sh and resumes only after it succeeds.
EOF
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

acquire_setup_lock() {
  local owner=''
  install -d -m 0700 "$STATE_DIR"
  if mkdir "$LOCK_DIR" 2>/dev/null; then
    printf '%s\n' "$$" >"$LOCK_DIR/pid"
    return 0
  fi
  [[ -s "$LOCK_DIR/pid" ]] && owner="$(cat "$LOCK_DIR/pid" 2>/dev/null || true)"
  if [[ "$owner" =~ ^[0-9]+$ ]] && ! kill -0 "$owner" 2>/dev/null; then
    rm -rf "$LOCK_DIR"
    mkdir "$LOCK_DIR"
    printf '%s\n' "$$" >"$LOCK_DIR/pid"
    return 0
  fi
  echo 'Another Codex profile setup is already running; wait for it to finish, then rerun.' >&2
  exit 1
}

release_setup_lock() {
  [[ -d "$LOCK_DIR" ]] && rm -rf "$LOCK_DIR"
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

subscription_ready() {
  local relative source target
  for relative in config.toml AGENTS.md hooks.json keybindings.json rules/dotfiles.rules; do
    source="$ROOT/codex/.codex/$relative"
    target="$DEFAULT_HOME/$relative"
    [[ -e "$target" && "$target" -ef "$source" ]] || return 1
  done
}

ensure_subscription_home() {
  if subscription_ready; then
    echo 'Subscription Codex home is already Stow-managed.'
    return 0
  fi
  echo 'Preparing the subscription Codex home with the reviewed Stow migration...'
  bash "$ROOT/scripts/bootstrap-codex.sh" apply
  subscription_ready || {
    echo 'Codex Stow migration returned without linking every managed subscription file.' >&2
    echo "Run bash $ROOT/scripts/bootstrap-codex.sh check after resolving the reported conflict." >&2
    exit 1
  }
  echo 'Subscription Codex home is fully Stow-managed.'
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
print_journey
echo
require_gateway
acquire_setup_lock
trap release_setup_lock EXIT
trap 'release_setup_lock; exit 130' INT
trap 'release_setup_lock; exit 143' TERM
PREVIOUS_MODE="$(configured_mode)"
temporary="$(mktemp "${TMPDIR:-/tmp}/codex-profile.XXXXXX")"
cleanup() { rm -f "$temporary"; release_setup_lock; }
trap cleanup EXIT
trap 'cleanup; exit 130' INT
trap 'cleanup; exit 143' TERM
curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 "$DOWNLOAD_URL" --output "$temporary"
actual="$(shasum -a 256 "$temporary" | awk '{print $1}')"
[[ "$actual" == "$SHA256" ]] || { echo 'codex-profile checksum mismatch; nothing installed.' >&2; exit 1; }
install -m 0755 "$temporary" "$PROFILE_BIN"
ln -sfn codex-profile "$BIN_DIR/codex-profiles"
"$PROFILE_BIN" version >/dev/null
prepare_mode_homes "$PREVIOUS_MODE"
case "$MODE" in subscription|both) ensure_subscription_home ;; esac
rm -f "$BIN_DIR/chatgpt-subscription" "$BIN_DIR/chatgpt-aigateway"

case "$MODE" in
  subscription|both)
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
echo 'Terminal Codex remains gateway-backed; the selected mode changes desktop homes only.'
cat <<EOF

Active and generated paths:
  $PROFILE_BIN                              pinned codex-profile executable
  $MODE_FILE                                selected mode (0600)
  $ACTIVE_CODEX_HOME_FILE                   terminal gateway Codex home (0600)
EOF
case "$MODE" in
  subscription)
    cat <<EOF
  $DEFAULT_HOME                             subscription desktop home; tracked files Stow-linked
  $BIN_DIR/chatgpt-subscription             subscription desktop launcher (0700)
EOF
    ;;
  gateway)
    cat <<EOF
  $DEFAULT_HOME                             gateway desktop and CLI home
  $BIN_DIR/chatgpt-aigateway                gateway desktop launcher (0700)
  $PARKED_SUBSCRIPTION_HOME                 retained subscription home when present
EOF
    ;;
  both)
    cat <<EOF
  $DEFAULT_HOME                             subscription desktop home; tracked files Stow-linked
  $GATEWAY_HOME                             isolated gateway desktop and CLI home
  $BIN_DIR/chatgpt-subscription             subscription desktop launcher (0700)
  $BIN_DIR/chatgpt-aigateway                gateway desktop launcher (0700)
EOF
    ;;
esac
cat <<EOF

Gateway source files remain under:
  $GATEWAY_CONFIG_DIR

Next:
EOF
case "$MODE" in
  subscription) echo '  Run chatgpt-subscription and complete the normal ChatGPT subscription login.' ;;
  gateway) echo '  Run chatgpt-aigateway and verify the gateway model/provider.' ;;
  both) printf '%s\n' '  Run chatgpt-subscription and complete subscription login.' '  Run chatgpt-aigateway and verify the gateway model/provider.' ;;
esac
status
