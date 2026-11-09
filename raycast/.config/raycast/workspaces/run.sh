#!/bin/bash
set -euo pipefail
package="$(cd -- "$(dirname -- "$0")" && pwd)"
action="${1:-check}"
# A shared directory lock prevents two workspace actions interleaving. Read-only
# setup commands never lock. No automatic stale-lock deletion during a live run.
case "$action" in
  layout|workspace|focus)
    task_state="${RAYCAST_WORKSPACES_STATE:-$HOME/Library/Application Support/dotfiles/raycast-workspaces}"
    mkdir -p "$task_state"
    lock="$task_state/switch.lock"
    if ! mkdir "$lock" 2>/dev/null; then
      echo "Another workspace action is active. Dismiss its Focus dialog first. If its process exited, remove $lock after checking." >&2
      exit 1
    fi
    printf '%s\n' "$$" > "$lock/pid"
    trap 'rm -f "$lock/pid"; rmdir "$lock" 2>/dev/null || true' EXIT
    /usr/bin/osascript -l JavaScript "$package/runtime.js" "$package" "$@"
    ;;
  *) exec /usr/bin/osascript -l JavaScript "$package/runtime.js" "$package" "$@" ;;
esac
