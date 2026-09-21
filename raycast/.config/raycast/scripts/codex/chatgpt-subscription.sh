#!/bin/bash
# @raycast.schemaVersion 1
# @raycast.title ChatGPT — Subscription
# @raycast.mode silent
# @raycast.packageName Codex Profiles
# @raycast.icon 💬
# @raycast.needsConfirmation false
# @raycast.description Launch the subscription ChatGPT/Codex desktop profile
# @raycast.author Rahul Nakmol
# @raycast.authorURL https://github.com/rahulnakmol

source "$HOME/.config/raycast/lib/codex-profile.sh"
if ! launch_codex_profile subscription; then
  osascript -e 'display dialog "The subscription ChatGPT profile is not enabled. Run: bash scripts/setup-codex-profiles.sh --mode subscription (or both) from your dotfiles checkout." buttons {"OK"} default button "OK" with icon caution' >/dev/null
  exit 1
fi
