#!/bin/bash

# Required parameters:
# @raycast.schemaVersion 1
# @raycast.title Launch Ghostty
# @raycast.mode silent

# Optional parameters:
# @raycast.icon 🖥️
# @raycast.packageName App Launchers
# @raycast.description Launch Ghostty with Option-G while its app command keeps Command-Shift-Enter.

set -euo pipefail
exec /usr/bin/open -a Ghostty
