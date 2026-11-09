#!/bin/bash

# @raycast.schemaVersion 1
# @raycast.title Open Default Browser
# @raycast.mode silent
# @raycast.packageName Browser
# @raycast.icon 🌐
# @raycast.description Open a blank tab through the current macOS default web handler.

set -euo pipefail

case "${1:-}" in
  ''|--print-browser) ;;
  *) printf 'Usage: %s [--print-browser]\n' "$0" >&2; exit 2 ;;
esac

# Resolve HTTPS afresh: no browser name, bundle ID or preference-file format is
# hard-coded. The URL is used only for Launch Services lookup, never visited.
browser_path="$(/usr/bin/osascript -l JavaScript <<'JXA'
ObjC.import('AppKit');
var target = $.NSWorkspace.sharedWorkspace.URLForApplicationToOpenURL(
  $.NSURL.URLWithString('https://example.com')
);
if (target.isNil()) throw new Error('No default HTTPS application is configured.');
ObjC.unwrap(target.path);
JXA
)"

if [[ -z "$browser_path" || ! -d "$browser_path" ]]; then
  printf 'Could not resolve an installed default browser. Check macOS Settings.\n' >&2
  exit 1
fi

if [[ "${1:-}" == --print-browser ]]; then
  printf '%s\n' "$browser_path"
  exit 0
fi

# Explicitly target the HTTPS handler, since opening about:blank on its own can
# use a different scheme handler. Sending a blank URL also lets routers such as
# Velja forward the request, rather than merely opening their settings window.
exec /usr/bin/open -a "$browser_path" 'about:blank'
