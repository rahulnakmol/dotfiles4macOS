#!/bin/bash
# @raycast.schemaVersion 1
# @raycast.title ChatGPT — AI Gateway
# @raycast.mode silent
# @raycast.packageName Codex Profiles
# @raycast.icon 🔐
# @raycast.needsConfirmation false
# @raycast.description Launch the private AI gateway ChatGPT/Codex desktop profile
# @raycast.author Rahul Nakmol
# @raycast.authorURL https://github.com/rahulnakmol

source "$HOME/.config/raycast/lib/codex-profile.sh"
if ! launch_codex_profile gateway; then
  osascript -e 'display dialog "The AI gateway ChatGPT profile is not enabled. Run the private AI gateway setup, then: bash scripts/setup-codex-profiles.sh --mode gateway (or both)." buttons {"OK"} default button "OK" with icon caution' >/dev/null
  exit 1
fi
