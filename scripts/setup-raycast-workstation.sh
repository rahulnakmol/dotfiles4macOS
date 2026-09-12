#!/bin/bash
# Opt-in macOS source build and local Raycast installation.
set -euo pipefail
root="$(cd -- "$(dirname -- "$0")/.." && pwd)"
extension="$root/extensions/raycast-workstation"
action="${1:-plan}"

fail() { echo "$*" >&2; exit 1; }
need() { command -v "$1" >/dev/null || fail "Missing $1. $2"; }
node_ready() {
  need node 'Install Node with Homebrew: brew install node'
  node -e 'const [major,minor]=process.versions.node.split(".").map(Number); process.exit(major>22 || (major===22 && minor>=18) ? 0 : 1)' \
    || fail 'Node 22.18+ required for TypeScript tests. Update Node with Homebrew or your version manager.'
}
validate() {
  cmp "$root/raycast/.config/raycast-workstation/workstation.json" "$extension/assets/workstation.json"
  node "$root/scripts/build-raycast-keymap.mjs" --check
  node --test "$root/scripts/test-raycast-keymap.mjs"
  (cd "$extension" && npm test && npm run typecheck)
}
build() {
  xcrun --find swiftc >/dev/null || fail 'Install Xcode Command Line Tools: xcode-select --install'
  (
    cd "$extension"
    npm ci --ignore-scripts
    cp "$root/raycast/.config/raycast-workstation/workstation.json" assets/workstation.json
    xcrun swiftc assets/DesktopHelper.swift -o assets/desktop-helper
  )
  validate
  (cd "$extension" && npm run build)
}

case "$action" in
  plan)
    cat <<'PLAN'
Workmode — optional macOS productivity extension for both FDE and TF.
Prerequisites: Node 22.18+, npm, GNU Stow, Xcode Command Line Tools and Raycast.
Layouts/focus need Raycast Pro, DockFlow and the selected mode's apps; timers need Session.
  build    Compile and validate only. Does not Stow or import into Raycast.
  install  Build, Stow curated configuration, then import with Raycast's CLI.
           At "ready", press Control+C. The extension remains installed.
  check    Verify local source, helper and Stow link. Use wchk for live prerequisites.
  rollback Unstow configuration only; remove the extension in Raycast Settings if wanted.
  apply    Legacy prepare-only command; use install for a complete local installation.
Run from this checkout: bash scripts/setup-raycast-workstation.sh install
Or double-click setup/Raycast.command. Repeat install after pulling updates.
Manual setup: docs/raycast-workstation.md — four Spaces, DockFlow presets, Session categories,
permissions, licenses, aliases and hotkeys. Raycast Option+Space; Spotlight Command+Space.
This script does not install apps, change login items or edit Raycast's private settings.
PLAN
    exit 0 ;;
  build|install|apply|check|rollback) ;;
  *) fail 'Usage: bash scripts/setup-raycast-workstation.sh plan|build|install|check|rollback|apply' ;;
esac

[[ "$(uname -s)" == Darwin ]] || fail 'Workmode requires macOS.'
if [[ "$action" == rollback ]]; then
  need stow 'Install GNU Stow: brew install stow'
  stow -n -D --no-folding -d "$root" -t "$HOME" raycast
  stow -D --no-folding -d "$root" -t "$HOME" raycast
  echo 'Configuration unstowed. The installed extension retains bundled defaults.'
  echo 'To disable Workmode, remove it in Raycast Settings. App data and native settings remain.'
  exit 0
fi

node_ready
need npm 'Install Node and npm: brew install node'
if [[ "$action" == install || "$action" == apply ]]; then
  need stow 'Install GNU Stow: brew install stow'
  if [[ "$action" == install ]]; then
    [[ -d /Applications/Raycast.app || -d "$HOME/Applications/Raycast.app" ]] \
      || fail 'Install Raycast first: brew install --cask raycast'
  fi
  # Refuse conflicts before downloading dependencies or replacing any configuration.
  stow -n --no-folding -d "$root" -t "$HOME" raycast
fi
if [[ "$action" == check ]]; then
  config="$HOME/.config/raycast-workstation/workstation.json"
  [[ -L "$config" ]] || fail 'Configuration is not Stow-linked. Run install.'
  [[ "$(node -e 'console.log(require("fs").realpathSync(process.argv[1]))' "$config")" == "$root/raycast/.config/raycast-workstation/workstation.json" ]] \
    || fail 'Configuration points to a different checkout.'
  [[ -x "$extension/assets/desktop-helper" ]] || fail 'Native helper is not built. Run install.'
  validate
  echo 'Source and Stow checks passed. In Raycast run Check Workmode Setup (wchk).'
  echo 'These checks do not prove Raycast import, permissions, window placement or timer transitions.'
  exit 0
fi

build
if [[ "$action" == build ]]; then
  echo 'Build validated; nothing Stowed or imported. Run install to use it in Raycast.'
  exit 0
fi
stow --no-folding -d "$root" -t "$HOME" raycast
if [[ "$action" == apply ]]; then
  echo 'Configuration linked. Run install to import/update the extension in Raycast.'
  exit 0
fi
cd "$extension"
echo 'Importing Workmode. At "ready", press Control+C; Raycast keeps it installed.'
echo "Then follow $root/docs/raycast-workstation.md and run Check Workmode Setup in Raycast."
exec npm run dev
