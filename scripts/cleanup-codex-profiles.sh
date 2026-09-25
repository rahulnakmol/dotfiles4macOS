#!/usr/bin/env bash
# Retire gateway desktop profiles without deleting user state.
set -euo pipefail

ROOT="${DOTFILES_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)}"
STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/dotfiles/codex-profiles"
DATA_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/dotfiles"
MODE_FILE="$STATE_DIR/mode"
DEFAULT_HOME="$HOME/.codex"
GATEWAY_DESKTOP_HOME="$HOME/.codex-aigateway"
PARKED_SUBSCRIPTION_HOME="$STATE_DIR/subscription-home"
PARKED_GATEWAY_HOME="$STATE_DIR/gateway-home"
PROFILE_ROOT="$HOME/.config/codex-profiles"
GATEWAY_DIR="$HOME/.config/private-ai-gateway"
GATEWAY_CLI_HOME="$GATEWAY_DIR/codex"
ACTIVE_CODEX_HOME_FILE="$GATEWAY_DIR/codex-home"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)-$$"
ARCHIVE="$DATA_DIR/codex-profile-archives/$STAMP"
LOCK_DIR="$STATE_DIR/cleanup.lock"
OLD_PROFILE_SHA256='8b32679d8be7d44eaf424c9f1fdf971817226c35b155c33c0082f98243825a2a'

[[ "$(uname -s)" == Darwin ]] || { echo 'Codex profile cleanup supports macOS only.' >&2; exit 1; }
[[ "${EUID:-$(id -u)}" != 0 ]] || { echo 'Run as the signed-in macOS user, not with sudo.' >&2; exit 1; }
[[ ! -e "$STATE_DIR/setup.lock" ]] || { echo 'Codex profile setup is in progress or left a lock; resolve it before cleanup.' >&2; exit 1; }
[[ ! -L "$PROFILE_ROOT/bin/codex-profile" ]] || {
  echo "An unrecognized symlink exists at $PROFILE_ROOT/bin/codex-profile; move it manually before cleanup." >&2
  exit 1
}
if [[ -e "$PROFILE_ROOT/bin/codex-profile" ]]; then
  actual="$(shasum -a 256 "$PROFILE_ROOT/bin/codex-profile" | awk '{print $1}')"
  [[ "$actual" == "$OLD_PROFILE_SHA256" ]] || {
    echo "An unrecognized profile launcher exists at $PROFILE_ROOT/bin/codex-profile; move it manually before cleanup." >&2
    exit 1
  }
fi
if [[ -e "$DEFAULT_HOME" && -L "$DEFAULT_HOME" ]]; then
  echo "Codex home is a symlink: $DEFAULT_HOME. Resolve it manually before cleanup." >&2
  exit 1
fi
install -d -m 0700 "$STATE_DIR"
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo 'Another Codex profile cleanup is running. Wait for it to finish, then rerun.' >&2
  exit 1
fi
trap 'rm -rf "$LOCK_DIR"' EXIT INT TERM

mode='unknown'
[[ -s "$MODE_FILE" ]] && mode="$(<"$MODE_FILE")"
# If the mode marker was removed, recognize only the old generated gateway
# config link; never infer ownership from a directory name or archive a normal
# subscription home on a fresh machine.
if [[ "$mode" == unknown && -L "$DEFAULT_HOME/config.toml" && "$(readlink "$DEFAULT_HOME/config.toml")" == "$GATEWAY_CLI_HOME/config.toml" ]]; then
  mode=gateway
fi
case "$mode" in
  gateway|both|subscription|unknown) ;;
  *) echo "Unrecognized legacy Codex mode at $MODE_FILE; review it before cleanup." >&2; exit 1 ;;
esac
if [[ "$mode" == gateway && ( -e "$PARKED_SUBSCRIPTION_HOME" || -L "$PARKED_SUBSCRIPTION_HOME" ) && ! -e "$DEFAULT_HOME" && ! -L "$DEFAULT_HOME" ]]; then
  echo 'Gateway mode has a parked subscription home but no active gateway home; review the interrupted transition before cleanup.' >&2
  exit 1
fi
if [[ "$mode" == gateway && ( -L "$PARKED_SUBSCRIPTION_HOME" || ! -d "$PARKED_SUBSCRIPTION_HOME" ) && ( -e "$PARKED_SUBSCRIPTION_HOME" || -L "$PARKED_SUBSCRIPTION_HOME" ) ]]; then
  echo 'Parked subscription home is not a real directory; review it before cleanup.' >&2
  exit 1
fi
if [[ "$mode" == gateway && ( -e "$DEFAULT_HOME" || -L "$DEFAULT_HOME" ) ]]; then
  if [[ ! -L "$DEFAULT_HOME/config.toml" || "$(readlink "$DEFAULT_HOME/config.toml")" != "$GATEWAY_CLI_HOME/config.toml" ]]; then
    echo 'Active Codex config is not the prepared gateway link; review it before archiving the home.' >&2
    exit 1
  fi
fi
archive_path() {
  local source="$1" name="$2"
  [[ -e "$source" || -L "$source" ]] || return 0
  install -d -m 0700 "$ARCHIVE"
  mv "$source" "$ARCHIVE/$name"
  echo "Archived: $source -> $ARCHIVE/$name"
}

if [[ "$mode" == gateway && -e "$DEFAULT_HOME" && ! -e "$PARKED_SUBSCRIPTION_HOME" ]]; then
  echo 'Legacy gateway mode has no parked subscription home. Archiving gateway state before creating a new subscription home.'
fi

case "$mode" in
  gateway)
    archive_path "$DEFAULT_HOME" gateway-default-home
    if [[ -e "$PARKED_SUBSCRIPTION_HOME" || -L "$PARKED_SUBSCRIPTION_HOME" ]]; then
      mv "$PARKED_SUBSCRIPTION_HOME" "$DEFAULT_HOME"
      echo "Restored subscription home: $DEFAULT_HOME"
    fi
    ;;
  both)
    archive_path "$GATEWAY_DESKTOP_HOME" gateway-desktop-home
    ;;
  subscription|unknown)
    archive_path "$GATEWAY_DESKTOP_HOME" gateway-desktop-home
    ;;
esac
archive_path "$PARKED_GATEWAY_HOME" parked-gateway-home
if [[ -e "$PARKED_SUBSCRIPTION_HOME" || -L "$PARKED_SUBSCRIPTION_HOME" ]]; then
  if [[ -e "$DEFAULT_HOME" || -L "$DEFAULT_HOME" ]]; then
    archive_path "$PARKED_SUBSCRIPTION_HOME" parked-subscription-home
  else
    mv "$PARKED_SUBSCRIPTION_HOME" "$DEFAULT_HOME"
    echo "Restored subscription home: $DEFAULT_HOME"
  fi
fi

# Older launcher routes may remain in Raycast's configured Script Commands
# directory after the Stow source disappears. Remove only exact legacy links.

remove_owned_link() {
  local path="$1" target=''
  [[ -L "$path" ]] || return 0
  target="$(readlink "$path")"
  case "$target" in
    "$ROOT/raycast/.config/raycast/scripts/codex/chatgpt-subscription.sh"|"$ROOT/raycast/.config/raycast/scripts/codex/chatgpt-aigateway.sh"|"$ROOT/raycast/.config/raycast/lib/codex-profile.sh")
      rm -f "$path"; echo "Removed obsolete repository link: $path" ;;
  esac
}
remove_owned_link "$HOME/.config/raycast/scripts/codex/chatgpt-subscription.sh"
remove_owned_link "$HOME/.config/raycast/scripts/codex/chatgpt-aigateway.sh"
remove_owned_link "$HOME/.config/raycast/lib/codex-profile.sh"
rmdir "$HOME/.config/raycast/scripts/codex" "$HOME/.config/raycast/scripts" "$HOME/.config/raycast/lib" 2>/dev/null || true

if [[ -s "$GATEWAY_DIR/client.key" && -s "$GATEWAY_CLI_HOME/config.toml" ]]; then
  printf '%s\n' "$GATEWAY_CLI_HOME" >"$ACTIVE_CODEX_HOME_FILE"
  chmod 0600 "$ACTIVE_CODEX_HOME_FILE"
  echo "Terminal Codex gateway home: $GATEWAY_CLI_HOME"
else
  echo 'Terminal gateway state is not prepared; run scripts/setup-private-ai-gateway.sh.'
fi

if [[ ! -d "$DEFAULT_HOME" ]]; then
  install -d -m 0700 "$DEFAULT_HOME"
  echo "Created empty subscription home: $DEFAULT_HOME (sign in when ChatGPT opens)"
fi
CODEX_HOME="$DEFAULT_HOME" /bin/bash "$ROOT/scripts/bootstrap-codex.sh" apply
rm -f "$PROFILE_ROOT/bin/codex-profile"
rmdir "$PROFILE_ROOT/bin" "$PROFILE_ROOT" 2>/dev/null || true
rm -f "$MODE_FILE"

echo 'Codex desktop reset complete: ChatGPT now uses the normal subscription home only.'
if [[ -d "$ARCHIVE" ]]; then
  echo "Retired profile state was preserved at: $ARCHIVE"
else
  echo 'No retired gateway desktop state needed archiving.'
fi
