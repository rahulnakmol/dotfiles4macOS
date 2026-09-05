#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MANIFEST="${ROOT}/skills.manifest.yaml"
SKILLS_REPO="${SKILLS_REPO:-$HOME/Developer/GitHub/skills}"

# Codex-only installation uses the upstream linker in the documented user bucket.
# It does not run other tools' adapters or download unpinned third-party packages.
if [[ "${1:-}" == --codex ]]; then
  shift
  if [[ ! -f "$SKILLS_REPO/scripts/link-skills.sh" ]]; then
    echo "Clone https://github.com/rahulnakmol/skills.git to $SKILLS_REPO first." >&2
    exit 1
  fi
  exec bash "$SKILLS_REPO/scripts/link-skills.sh" --target "$HOME/.agents/skills" "$@"
fi

if [[ ! -f "$MANIFEST" ]]; then
  echo "Missing $MANIFEST" >&2
  exit 1
fi

echo "==> Bootstrap skills from manifest"

if [[ -d "$SKILLS_REPO" ]]; then
  echo "==> First-party: rahulnakmol/skills at $SKILLS_REPO"
  if command -v npx >/dev/null 2>&1; then
    npx skills@latest add rahulnakmol/skills || true
  fi
  bash "$SKILLS_REPO/scripts/link-skills.sh"
  bash "$SKILLS_REPO/scripts/install-adapters.sh"
else
  echo "Clone skills repo first: git clone https://github.com/rahulnakmol/skills.git $SKILLS_REPO" >&2
  exit 1
fi

if command -v npx >/dev/null 2>&1; then
  echo "==> Third-party: mattpocock/skills"
  npx skills@latest add mattpocock/skills --skill=setup-matt-pocock-skills || true
fi

if command -v claude >/dev/null 2>&1; then
  echo "==> Third-party: caveman plugin"
  claude plugins install caveman || true
fi

echo "==> Done. Commit skills-lock.json in project repos after npx skills add."
