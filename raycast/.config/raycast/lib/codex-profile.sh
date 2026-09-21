#!/bin/bash
# Shared implementation sourced by Raycast Script Commands and shell functions.

launch_codex_profile() {
  local route="$1" profile_bin mode_file mode profile lock owner='' launched_at='' now
  profile_bin="$HOME/.config/codex-profiles/bin/codex-profile"
  mode_file="${XDG_STATE_HOME:-$HOME/.local/state}/dotfiles/codex-profiles/mode"
  mode="$(cat "$mode_file" 2>/dev/null || true)"
  case "$route:$mode" in
    subscription:subscription|subscription:both) profile=default ;;
    gateway:gateway) profile=default ;;
    gateway:both) profile=aigateway ;;
    *) return 64 ;;
  esac
  [[ -x "$profile_bin" ]] || return 69

  lock="${TMPDIR:-/tmp}/dotfiles-chatgpt-${route}-${UID}.lock"
  now="$(date +%s)"
  if ! mkdir "$lock" 2>/dev/null; then
    [[ -s "$lock/pid" ]] && owner="$(cat "$lock/pid" 2>/dev/null || true)"
    [[ -s "$lock/launched-at" ]] && launched_at="$(cat "$lock/launched-at" 2>/dev/null || true)"
    if [[ "$owner" =~ ^[0-9]+$ ]] && kill -0 "$owner" 2>/dev/null; then
      return 0
    elif [[ "$launched_at" =~ ^[0-9]+$ ]] && (( now - launched_at < 3 )); then
      return 0
    else
      rm -rf "$lock"
      mkdir "$lock" 2>/dev/null || return 0
    fi
  fi
  printf '%s\n' "$$" >"$lock/pid"
  trap 'rm -rf "$lock"' INT TERM
  unset CODEX_HOME CODEX_ACCESS_TOKEN CODEX_SQLITE_HOME CODEX_ELECTRON_USER_DATA_PATH CODEX_PROFILE_NAME
  export CODEX_PROFILE_NO_UPDATE_CHECK=1
  if ! "$profile_bin" app "$profile" >/dev/null 2>&1; then
    rm -rf "$lock"
    trap - INT TERM
    return 1
  fi
  date +%s >"$lock/launched-at"
  rm -f "$lock/pid"
  trap - INT TERM
}
