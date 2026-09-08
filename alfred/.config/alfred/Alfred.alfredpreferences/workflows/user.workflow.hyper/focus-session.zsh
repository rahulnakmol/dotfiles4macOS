#!/bin/zsh
set -eu
workflow_dir="${0:A:h}"
cache="$HOME/Library/Caches/com.rahulnakmol.hyper"
mkdir -p "$cache"
# Include OS/architecture so a cache copied from another Mac is never reused.
fingerprint=$( { /usr/bin/shasum -a 256 "$workflow_dir/FocusSession.swift"; /usr/bin/sw_vers -buildVersion; /usr/bin/uname -m; } | /usr/bin/shasum -a 256 | /usr/bin/cut -d ' ' -f 1)
binary="$cache/focus-$fingerprint"
if [[ ! -x "$binary" ]]; then
  temporary=$(mktemp "$cache/build.XXXXXX")
  trap 'rm -f "$temporary"' EXIT
  if ! /usr/bin/xcrun swiftc -parse-as-library "$workflow_dir/FocusSession.swift" -o "$temporary"; then
    print 'Focus setup needs Apple Command Line Tools. Run xcode-select --install, then retry.'
    exit 1
  fi
  mv -f "$temporary" "$binary"
fi
session="${1#focus:}"
shift
exec "$binary" "$workflow_dir/focus-sessions.json" "$session" "$@"
