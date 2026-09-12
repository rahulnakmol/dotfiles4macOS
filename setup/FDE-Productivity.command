#!/bin/bash
set -euo pipefail
setup_dir="$(cd -- "$(dirname -- "$0")/.." && pwd)"
checkout_args=()
if [[ -e "$setup_dir/.git" ]]; then checkout_args=(--directory "$setup_dir"); fi
status=0
/bin/bash "$setup_dir/install.sh" "${checkout_args[@]}" --profile fde --productivity "$@" || status=$?
if [[ -t 0 ]]; then read -r -p "Press Return to close this setup window."; fi
exit "$status"
