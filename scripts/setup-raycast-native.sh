#!/bin/bash
# No npm, developer mode, Swift compiler, Stow adoption or private Raycast writes.
set -euo pipefail
root="$(cd -- "$(dirname -- "$0")/.." && pwd)"
runner="$root/raycast/.config/raycast/workspaces/run.sh"
action="${1:-plan}"
case "$action" in
  plan)
    cat <<EOF
Native Raycast Focus & Layouts
1. bash scripts/setup-raycast-native.sh install
2. Add Script Directory: $root/raycast/.config/raycast/scripts
3. Run 'export-layouts', then Raycast Import Commands & Layouts with the printed JSON.
   Check display assignments once. Run 'connect-layouts' only after import succeeds.
4. Save each real Copy Deeplink: bash scripts/setup-raycast-native.sh link VARIANT laptop|desk 'raycast://...'
5. Assign aliases/hotkeys from workspaces/reference.json in native Settings.
6. Import workspaces/quicklinks.json for Mobbin. Focus defaults to 45 minutes.
Run 'apps' to install only missing Homebrew casks. No custom extension needed.
EOF
    ;;
  install|check|screens|profile|link|apps|preview|export-layouts|connect-layouts)
    [[ "$(uname -s)" == Darwin ]] || { echo 'macOS is required.' >&2; exit 1; }
    case "$action" in
      install) bash "$runner" init; bash "$runner" check; bash "$0" plan ;;
      check|screens|connect-layouts) exec bash "$runner" "$action" ;;
      export-layouts) shift; exec bash "$runner" "$action" "$@" ;;
      profile|link) shift; exec bash "$runner" "$action" "$@" ;;
      preview) shift; exec bash "$runner" plan "$@" ;;
      apps)
        command -v brew >/dev/null || { echo 'Install Homebrew from https://brew.sh first.' >&2; exit 1; }
        missing="$(bash "$runner" missing-casks)"
        if [[ -z "$missing" ]]; then echo 'All Homebrew-managed workspace apps are present.'; exit 0; fi
        while IFS= read -r cask; do [[ -z "$cask" ]] || brew install --cask "$cask"; done <<< "$missing"
        bash "$runner" check
        ;;
    esac
    ;;
  *) echo 'Usage: setup-raycast-native.sh plan|install|check|screens|apps|export-layouts [PATH]|connect-layouts|profile auto|laptop|desk|link VARIANT PROFILE URL|preview VARIANT [ACTION] [MINUTES] [PROFILE]' >&2; exit 2 ;;
esac
