#!/usr/bin/env bash
# Switch or combine desktop Codex homes; keep the terminal CLI gateway-backed.
set -euo pipefail

ROOT="${DOTFILES_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)}"
STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/dotfiles/codex-profiles"
MODE_FILE="$STATE_DIR/mode"
DESKTOP_HOME="$HOME/.codex"
GATEWAY_DIR="$HOME/.config/private-ai-gateway"
GATEWAY_HOME="$GATEWAY_DIR/codex"
CLI_HOME_FILE="$GATEWAY_DIR/codex-home"
SUBSCRIPTION_PARKED="$STATE_DIR/subscription-home"
GATEWAY_PARKED="$STATE_DIR/gateway-home"
SECOND_HOME="$HOME/.codex-aigateway"
PROFILE_BIN="$HOME/.config/codex-profiles/bin/codex-profile"
PROFILE_URL='https://raw.githubusercontent.com/Ducksss/codex-profiles/d2260b800297a2b6441b3341c5c3ac48b67d59a1/bin/codex-profile'
PROFILE_SHA256='8b32679d8be7d44eaf424c9f1fdf971817226c35b155c33c0082f98243825a2a'
MODE=subscription
ACTION=setup

usage() {
  echo 'Usage: scripts/setup-codex-profiles.sh [--mode subscription|gateway|both | --status | --cleanup]'
  echo 'Switch or combine desktop homes; terminal Codex always uses the isolated gateway home.'
}

case "${1:-}" in
  '') ;;
  --mode) [[ $# == 2 ]] || { usage >&2; exit 2; }; MODE="$2" ;;
  --status) ACTION=status ;;
  --cleanup) ACTION=cleanup ;;
  -h|--help) usage; exit 0 ;;
  *) usage >&2; exit 2 ;;
esac
[[ $# -le 2 && ( "$ACTION" != setup || "$MODE" == subscription || "$MODE" == gateway || "$MODE" == both ) ]] || { usage >&2; exit 2; }
[[ "$ACTION" == setup || $# -le 1 ]] || { usage >&2; exit 2; }

desktop_mode() {
  local recorded=unknown
  [[ -s "$MODE_FILE" ]] && recorded="$(<"$MODE_FILE")"
  case "$recorded" in
    gateway|subscription|both)
      if [[ "$recorded" == both && ( ! -d "$SECOND_HOME" || ! -L "$SECOND_HOME/config.toml" || "$(readlink "$SECOND_HOME/config.toml")" != "$GATEWAY_HOME/config.toml" ) ]]; then
        echo 'Both-mode marker disagrees with the gateway desktop home; review before switching.' >&2
        return 1
      fi
      if [[ "$recorded" == gateway && ( ! -L "$DESKTOP_HOME/config.toml" || "$(readlink "$DESKTOP_HOME/config.toml")" != "$GATEWAY_HOME/config.toml" ) ]]; then
        echo 'Gateway mode marker disagrees with the desktop config; review before switching.' >&2
        return 1
      fi
      if [[ ( "$recorded" == subscription || "$recorded" == both ) && -L "$DESKTOP_HOME/config.toml" && "$(readlink "$DESKTOP_HOME/config.toml")" == "$GATEWAY_HOME/config.toml" ]]; then
        echo 'Subscription mode marker disagrees with the desktop config; review before switching.' >&2
        return 1
      fi
      printf '%s\n' "$recorded" ;;
    unknown)
      if [[ -L "$DESKTOP_HOME/config.toml" && "$(readlink "$DESKTOP_HOME/config.toml")" == "$GATEWAY_HOME/config.toml" ]]; then
        echo gateway
      else
        echo subscription
      fi ;;
    *) echo "Legacy desktop mode '$recorded' needs one-time --cleanup before switching." >&2; return 1 ;;
  esac
}

status() {
  local failed=0 current
  current="$(desktop_mode)" || return 1
  printf 'desktop mode         %s (~/.codex)\n' "$current"
  if [[ -d "$SUBSCRIPTION_PARKED" ]]; then echo "subscription parked  $SUBSCRIPTION_PARKED"; fi
  if [[ -d "$GATEWAY_PARKED" ]]; then echo "gateway parked       $GATEWAY_PARKED"; fi
  if [[ "$current" == both ]]; then
    if [[ -L "$SECOND_HOME/config.toml" && "$(readlink "$SECOND_HOME/config.toml")" == "$GATEWAY_HOME/config.toml" && -x "$PROFILE_BIN" ]]; then
      echo "gateway desktop     $SECOND_HOME (named launcher ready)"
    else
      echo 'gateway desktop     missing config or named launcher'; failed=1
    fi
  fi
  if [[ -s "$GATEWAY_DIR/client.key" && -s "$GATEWAY_HOME/config.toml" ]]; then
    echo 'terminal codex       gateway prepared'
  else
    echo 'terminal codex       gateway absent'; failed=1
  fi
  if [[ -s "$CLI_HOME_FILE" && "$(<"$CLI_HOME_FILE")" == "$GATEWAY_HOME" && -x "$HOME/.local/bin/codex" ]]; then
    printf 'terminal CODEX_HOME  %s (wrapper installed)\n' "$GATEWAY_HOME"
  else
    echo 'terminal CODEX_HOME  wrapper or isolated gateway home not ready'; failed=1
  fi
  [[ -d "$DESKTOP_HOME" ]] || { echo 'desktop home         absent'; failed=1; }
  return "$failed"
}

if [[ "$ACTION" == status ]]; then status; exit; fi
[[ "$(uname -s)" == Darwin ]] || { echo 'Codex setup supports macOS only.' >&2; exit 1; }
[[ "${EUID:-$(id -u)}" != 0 ]] || { echo 'Run as the signed-in macOS user, not with sudo.' >&2; exit 1; }
if [[ "$ACTION" == cleanup ]]; then exec /bin/bash "$ROOT/scripts/cleanup-codex-profiles.sh"; fi

for path in "$DESKTOP_HOME" "$SUBSCRIPTION_PARKED" "$GATEWAY_PARKED" "$SECOND_HOME"; do
  [[ ! -L "$path" ]] || { echo "Refusing symlinked Codex home: $path" >&2; exit 1; }
  [[ ! -e "$path" || -d "$path" ]] || { echo "Codex home is not a directory: $path" >&2; exit 1; }
done
[[ ! -e "$STATE_DIR/setup.lock" && ! -e "$STATE_DIR/cleanup.lock" ]] || {
  echo 'A Codex setup or cleanup lock exists; resolve it before switching.' >&2; exit 1;
}
current="$(desktop_mode)" || exit 1
second_preexisting=0
[[ -d "$SECOND_HOME" ]] && second_preexisting=1
if [[ "$current" != both && -e "$SECOND_HOME" && "$MODE" != both ]]; then
  echo "An unselected second desktop home exists at $SECOND_HOME; inspect it or choose --mode both." >&2; exit 1
fi
if [[ "$current" != both && -e "$SECOND_HOME" && "$MODE" == both ]]; then
  [[ -L "$SECOND_HOME/config.toml" && "$(readlink "$SECOND_HOME/config.toml")" == "$GATEWAY_HOME/config.toml" ]] || {
    echo "Existing second home at $SECOND_HOME is not the prepared gateway home; review it before setup." >&2; exit 1;
  }
fi
if [[ ! -s "$GATEWAY_DIR/client.key" || ! -s "$GATEWAY_HOME/config.toml" ]]; then
  echo 'Private gateway state is missing. Run scripts/setup-private-ai-gateway.sh first.' >&2
  exit 1
fi

# The cask is the independent vendor CLI, not the executable bundled with ChatGPT.
# Do not mistake a generated ~/.local/bin wrapper for a Homebrew installation.
if [[ "$current" != "$MODE" ]] && pgrep -x ChatGPT >/dev/null 2>&1; then
  echo 'Quit ChatGPT before switching desktop homes, then rerun.' >&2
  exit 1
fi
command -v brew >/dev/null 2>&1 || { echo 'Install Homebrew before configuring the Codex CLI.' >&2; exit 1; }
if ! brew list --cask codex >/dev/null 2>&1; then
  echo 'Installing the Codex CLI separately from the ChatGPT desktop app...'
  brew install --cask codex
fi
vendor_bin="$(brew --prefix)/bin/codex"
[[ -x "$vendor_bin" ]] || { echo "Homebrew Codex binary missing: $vendor_bin" >&2; exit 1; }
[[ -x "$HOME/.local/bin/codex" ]] || echo 'Preparing the missing terminal gateway wrapper...'
# Refresh also revalidates the three gateway APIs; a failed validation leaves the
# desktop home untouched. Vendor discovery prefers the Homebrew binary.
/bin/bash "$ROOT/scripts/setup-private-ai-gateway.sh" --refresh
[[ -x "$HOME/.local/bin/codex" ]] || { echo 'Gateway refresh did not create the Codex CLI wrapper.' >&2; exit 1; }

if [[ "$MODE" != gateway ]]; then
  [[ -x /Applications/ChatGPT.app/Contents/Resources/codex || -x "$HOME/Applications/ChatGPT.app/Contents/Resources/codex" ]] || {
    echo 'Subscription Stow migration needs the ChatGPT desktop app: brew install --cask chatgpt' >&2; exit 1;
  }
fi
if [[ "$MODE" != subscription ]]; then
  for relative in config.toml AGENTS.md hooks.json keybindings.json rules/dotfiles.rules; do
    [[ -e "$GATEWAY_HOME/$relative" || -L "$GATEWAY_HOME/$relative" ]] || {
      echo "Missing gateway policy: $GATEWAY_HOME/$relative" >&2; exit 1;
    }
  done
fi
if [[ "$current" != "$MODE" ]]; then
  if [[ "$current" == subscription && "$MODE" == gateway && -e "$SUBSCRIPTION_PARKED" ]] ||
     [[ "$current" == gateway && "$MODE" == subscription && -e "$GATEWAY_PARKED" ]] ||
     [[ "$current" == gateway && "$MODE" == both && -e "$SECOND_HOME" ]] ||
     [[ "$current" == both && "$MODE" == gateway && -e "$SUBSCRIPTION_PARKED" ]] ||
     [[ "$current" == both && "$MODE" == subscription && -e "$GATEWAY_PARKED" ]]; then
    echo 'The inactive-home parking destination already exists; review it before switching.' >&2
    exit 1
  fi
fi

if [[ "$MODE" == both ]]; then
  if [[ -e "$PROFILE_BIN" && ! -L "$PROFILE_BIN" ]]; then
    actual="$(shasum -a 256 "$PROFILE_BIN" | awk '{print $1}')"
    [[ "$actual" == "$PROFILE_SHA256" ]] || { echo "Unrecognized desktop launcher at $PROFILE_BIN; review it before setup." >&2; exit 1; }
  elif [[ -L "$PROFILE_BIN" ]]; then
    echo "Refusing symlinked desktop launcher: $PROFILE_BIN" >&2; exit 1
  else
    temporary="$(mktemp "${TMPDIR:-/tmp}/codex-profile.XXXXXX")"
    trap 'rm -f "${temporary:-}"' EXIT
    curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 "$PROFILE_URL" --output "$temporary"
    actual="$(shasum -a 256 "$temporary" | awk '{print $1}')"
    [[ "$actual" == "$PROFILE_SHA256" ]] || { echo 'Pinned desktop launcher checksum mismatch; nothing installed.' >&2; exit 1; }
    install -d -m 0700 "$(dirname "$PROFILE_BIN")"
    install -m 0755 "$temporary" "$PROFILE_BIN"
    rm -f "$temporary"
    trap - EXIT
  fi
  "$PROFILE_BIN" version >/dev/null
fi

install -d -m 0700 "$STATE_DIR"
LOCK_DIR="$STATE_DIR/setup.lock"
mkdir "$LOCK_DIR" 2>/dev/null || { echo 'Another Codex setup is running.' >&2; exit 1; }
moved_from=() moved_to=()
move_home() {
  mv "$1" "$2"
  moved_from+=("$1") moved_to+=("$2")
}
rollback() {
  local result=$?
  if [[ "$result" != 0 && "$current" != "$MODE" ]]; then
    local i source destination failed_home
    if [[ "$MODE" == both && "$current" == subscription && "$second_preexisting" == 0 && ${#moved_from[@]} == 0 && -d "$SECOND_HOME" ]]; then
      failed_home="$STATE_DIR/incomplete-$(date -u +%Y%m%dT%H%M%SZ)-$$-new"
      mv "$SECOND_HOME" "$failed_home"
      echo "Preserved incomplete desktop home at $failed_home; inspect it before retrying." >&2
    fi
    for ((i=${#moved_from[@]}-1; i>=0; i--)); do
      source="${moved_from[i]}" destination="${moved_to[i]}"
      if [[ -e "$source" || -L "$source" ]]; then
        failed_home="$STATE_DIR/incomplete-$(date -u +%Y%m%dT%H%M%SZ)-$$-$i"
        mv "$source" "$failed_home"
        echo "Preserved incomplete desktop home at $failed_home; inspect it before retrying." >&2
      fi
      if [[ -e "$destination" || -L "$destination" ]]; then mv "$destination" "$source"; fi
    done
  fi
  rmdir "$LOCK_DIR" || true
  return "$result"
}
trap rollback EXIT

if [[ "$current" != "$MODE" ]]; then
  echo 'Switching desktop home; reopen ChatGPT after setup completes.'
  if [[ "$current:$MODE" == gateway:both ]]; then
    move_home "$DESKTOP_HOME" "$SECOND_HOME"
    if [[ -d "$SUBSCRIPTION_PARKED" ]]; then move_home "$SUBSCRIPTION_PARKED" "$DESKTOP_HOME"; fi
  elif [[ "$current:$MODE" == both:gateway ]]; then
    move_home "$DESKTOP_HOME" "$SUBSCRIPTION_PARKED"
    move_home "$SECOND_HOME" "$DESKTOP_HOME"
  elif [[ "$current:$MODE" == both:subscription ]]; then
    move_home "$SECOND_HOME" "$GATEWAY_PARKED"
  elif [[ "$current:$MODE" == subscription:both ]]; then
    if [[ -d "$GATEWAY_PARKED" ]]; then move_home "$GATEWAY_PARKED" "$SECOND_HOME"; fi
  elif [[ "$current" == subscription ]]; then
    [[ ! -e "$SUBSCRIPTION_PARKED" ]] || { echo 'Subscription parked home already exists; review before switching.' >&2; exit 1; }
    [[ ! -e "$GATEWAY_PARKED" || -d "$GATEWAY_PARKED" ]] || exit 1
    if [[ -d "$DESKTOP_HOME" ]]; then move_home "$DESKTOP_HOME" "$SUBSCRIPTION_PARKED"; fi
    if [[ -d "$GATEWAY_PARKED" ]]; then move_home "$GATEWAY_PARKED" "$DESKTOP_HOME"; fi
  else
    [[ ! -e "$GATEWAY_PARKED" ]] || { echo 'Gateway parked home already exists; review before switching.' >&2; exit 1; }
    [[ ! -e "$SUBSCRIPTION_PARKED" || -d "$SUBSCRIPTION_PARKED" ]] || exit 1
    if [[ -d "$DESKTOP_HOME" ]]; then move_home "$DESKTOP_HOME" "$GATEWAY_PARKED"; fi
    if [[ -d "$SUBSCRIPTION_PARKED" ]]; then move_home "$SUBSCRIPTION_PARKED" "$DESKTOP_HOME"; fi
  fi
fi

if [[ "$MODE" != gateway ]]; then
  install -d -m 0700 "$DESKTOP_HOME"
  CODEX_HOME="$DESKTOP_HOME" /bin/bash "$ROOT/scripts/bootstrap-codex.sh" apply
  CODEX_HOME="$DESKTOP_HOME" /bin/bash "$ROOT/scripts/bootstrap-codex.sh" check
fi
if [[ "$MODE" == gateway || "$MODE" == both ]]; then
  if [[ "$MODE" == both ]]; then target_home="$SECOND_HOME"; else target_home="$DESKTOP_HOME"; fi
  if [[ "$current" == "$MODE" && -d "$DESKTOP_HOME" ]]; then
    for relative in config.toml AGENTS.md hooks.json keybindings.json rules/dotfiles.rules; do
      source="$GATEWAY_HOME/$relative"
      target="$target_home/$relative"
      [[ ! -e "$target" && ! -L "$target" || -L "$target" && "$(readlink "$target")" == "$source" ]] || {
        echo "Refusing existing gateway desktop config: $target" >&2; exit 1;
      }
    done
  fi
  install -d -m 0700 "$target_home" "$target_home/rules"
  for relative in config.toml AGENTS.md hooks.json keybindings.json rules/dotfiles.rules; do
    source="$GATEWAY_HOME/$relative"
    target="$target_home/$relative"
    [[ -e "$source" || -L "$source" ]] || { echo "Missing gateway policy: $source" >&2; exit 1; }
    if [[ -L "$target" && "$(readlink "$target")" == "$source" ]]; then continue; fi
    [[ ! -e "$target" && ! -L "$target" ]] || { echo "Refusing existing gateway desktop config: $target" >&2; exit 1; }
    ln -s "$source" "$target"
  done
fi
if [[ "$MODE" == both ]]; then "$PROFILE_BIN" init default >/dev/null; "$PROFILE_BIN" init aigateway >/dev/null; fi
if command -v herdr >/dev/null 2>&1; then CODEX_HOME="$GATEWAY_HOME" herdr integration install codex >/dev/null; fi
printf '%s\n' "$MODE" >"$MODE_FILE"
chmod 0600 "$MODE_FILE"
printf '%s\n' "$GATEWAY_HOME" >"$CLI_HOME_FILE"
chmod 0600 "$CLI_HOME_FILE"
echo "Desktop mode: $MODE ($DESKTOP_HOME); terminal Codex: $GATEWAY_HOME"
echo "Parked desktop homes, when present, remain under $STATE_DIR. No sessions or credentials were merged."
status
