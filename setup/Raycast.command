#!/bin/bash
set -euo pipefail
root="$(cd -- "$(dirname -- "$0")/.." && pwd)"
exec bash "$root/scripts/setup-raycast-workstation.sh" install
