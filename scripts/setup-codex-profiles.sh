#!/usr/bin/env bash
# Install the pinned codex-profile launcher and configure subscription/gateway desktop routes.
set -euo pipefail

ROOT="${DOTFILES_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)}"
MODE=''
ACTION=install
PROFILE_ROOT="${CODEX_PROFILE_ROOT:-$HOME/.config/codex-profiles}"
PROFILE_BIN="$PROFILE_ROOT/bin/codex-profile"
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
  1. Preview and Stow the shared Raycast module, including both Codex Script Commands.
  2. Confirm the separately validated gateway key and prepared Codex provider exist.
     The terminal Codex CLI is always gateway-backed in every desktop mode.
  3. Acquire a per-user setup lock so two profile changes cannot move ~/.codex at once.
  4. Move or restore isolated Codex homes for '$MODE'. Inactive homes are parked,
     never merged or deleted.
  5. For subscription or both mode, run the reviewed Codex Stow migration and wait
     until every managed file is linked before creating launchers.
  6. Install the pinned codex-profile launcher and print every active/generated path.

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

migrate_owned_legacy_raycast() {
  local legacy="$HOME/.config/raycast-workstation" item target name
  [[ -d "$legacy" && ! -L "$legacy" ]] || return 0
  for name in workstation.json aliases.json hotkeys.json; do
    item="$legacy/$name"
    [[ -L "$item" ]] || continue
    target="$(readlink "$item")"
    case "$target" in
      "$ROOT/raycast/.config/raycast-workstation/$name"|*"/raycast/.config/raycast-workstation/$name")
        rm -f "$item"
        echo "Removed obsolete repository-owned link: $item"
        ;;
    esac
  done
  rmdir "$legacy" 2>/dev/null || true
  if [[ -e "$legacy" || -L "$legacy" ]]; then
    echo "Cannot migrate $legacy because it contains files not owned by this repository." >&2
    echo 'Back up or move those files, then rerun; nothing in that directory was deleted.' >&2
    exit 1
  fi
}

ensure_raycast_module() {
  local relative expected active
  command -v stow >/dev/null 2>&1 || {
    echo 'GNU Stow is required to deploy Raycast commands: brew install stow' >&2
    exit 1
  }
  migrate_owned_legacy_raycast
  echo 'Previewing the shared Raycast workstation and Script Commands module...'
  if ! stow -n --no-folding -d "$ROOT" -t "$HOME" raycast; then
    echo 'Cannot deploy the Raycast module because existing files conflict.' >&2
    echo "Review $ROOT/raycast and the reported paths under $HOME, back up personal files, then rerun." >&2
    exit 1
  fi
  stow --no-folding -d "$ROOT" -t "$HOME" raycast
  for relative in scripts/codex/chatgpt-subscription.sh scripts/codex/chatgpt-aigateway.sh lib/codex-profile.sh workstation/workstation.json workstation/aliases.json workstation/hotkeys.json; do
    expected="$ROOT/raycast/.config/raycast/$relative"
    active="$HOME/.config/raycast/$relative"
    [[ -e "$active" && "$active" -ef "$expected" ]] || {
      echo "Raycast Stow completed but the expected file is not linked: $active" >&2
      exit 1
    }
  done
  echo 'Raycast workstation configuration and both Codex Script Commands are Stow-managed.'
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
      if gateway_ready && [[ -x "$HOME/.local/bin/codex" ]]; then
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
  local failed=0 item selected script
  selected="$(configured_mode)"
  printf 'selected mode        %s\n' "$selected"
  if [[ -x "$PROFILE_BIN" ]] && [[ "$($PROFILE_BIN version 2>/dev/null)" == *"$VERSION"* ]]; then
    echo "codex-profile      pinned v$VERSION"
  else
    echo "codex-profile      absent or not pinned v$VERSION"
    failed=1
  fi
  for item in chatgpt-subscription chatgpt-aigateway; do
    script="$HOME/.config/raycast/scripts/codex/$item.sh"
    if [[ -x "$script" ]]; then
      case "$item:$selected" in
        chatgpt-subscription:subscription|chatgpt-subscription:both|chatgpt-aigateway:gateway|chatgpt-aigateway:both)
          printf '%-20s installed; route enabled\n' "$item" ;;
        *) printf '%-20s installed; route disabled by mode\n' "$item" ;;
      esac
    else
      printf '%-20s Script Command absent\n' "$item"
      failed=1
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
  rm -f "$PROFILE_BIN"
  echo 'Removed the pinned codex-profile executable. Stow-managed Raycast commands and profile homes were retained.'
  exit 0
fi

install -d -m 0700 "$PROFILE_ROOT/bin" "$STATE_DIR"
print_journey
echo
ensure_raycast_module
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
"$PROFILE_BIN" version >/dev/null
prepare_mode_homes "$PREVIOUS_MODE"
case "$MODE" in subscription|both) ensure_subscription_home ;; esac

case "$MODE" in
  subscription|both)
    if command -v herdr >/dev/null 2>&1; then
      CODEX_HOME="$HOME/.codex" herdr integration install codex >/dev/null
    fi
    ;;
esac
case "$MODE" in
  gateway|both)
    if [[ "$MODE" == gateway ]]; then
      install_herdr_codex "$DEFAULT_HOME"
    else
      install_herdr_codex "$GATEWAY_HOME"
    fi
    if [[ ! -x "$HOME/.local/bin/codex" ]]; then
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
  $HOME/.config/raycast/scripts/codex/chatgpt-subscription.sh
                                               Stow-managed Raycast Script Command
EOF
    ;;
  gateway)
    cat <<EOF
  $DEFAULT_HOME                             gateway desktop and CLI home
  $HOME/.config/raycast/scripts/codex/chatgpt-aigateway.sh
                                               Stow-managed Raycast Script Command
  $PARKED_SUBSCRIPTION_HOME                 retained subscription home when present
EOF
    ;;
  both)
    cat <<EOF
  $DEFAULT_HOME                             subscription desktop home; tracked files Stow-linked
  $GATEWAY_HOME                             isolated gateway desktop and CLI home
  $HOME/.config/raycast/scripts/codex/chatgpt-subscription.sh
                                               Stow-managed subscription command
  $HOME/.config/raycast/scripts/codex/chatgpt-aigateway.sh
                                               Stow-managed gateway command
EOF
    ;;
esac
cat <<EOF

Gateway source files remain under:
  $GATEWAY_CONFIG_DIR

Next:
EOF
case "$MODE" in
  subscription) printf '%s\n' '  In Raycast, add ~/.config/raycast/scripts once as a Script Commands directory, then run ChatGPT — Subscription.' '  In a shell, cxs and cx launch the same enabled route; cxg reports that gateway is disabled.' ;;
  gateway) printf '%s\n' '  In Raycast, add ~/.config/raycast/scripts once as a Script Commands directory, then run ChatGPT — AI Gateway.' '  In a shell, cxg and cx launch the same enabled route; cxs reports that subscription is disabled.' ;;
  both) printf '%s\n' '  In Raycast, add ~/.config/raycast/scripts once as a Script Commands directory.' '  Run ChatGPT — Subscription or ChatGPT — AI Gateway.' '  In a shell, use cxs or cxg; cx refuses to guess between two profiles.' ;;
esac
status
