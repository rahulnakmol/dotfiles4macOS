#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MANIFEST="${ROOT}/skills.manifest.yaml"
SKILLS_REPO="${SKILLS_REPO:-$HOME/Developer/GitHub/skills}"
GATEWAY_ROOT="${PRIVATE_AI_GATEWAY_CONFIG_DIR:-$HOME/.config/private-ai-gateway}"
CLAUDE_GATEWAY_HOME="$GATEWAY_ROOT/claude"
OPENCODE_GATEWAY_HOME="$GATEWAY_ROOT/opencode"

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
  bash "$SKILLS_REPO/scripts/link-skills.sh" --target "$HOME/.agents/skills"
  bash "$SKILLS_REPO/scripts/link-skills.sh" --target "$CLAUDE_GATEWAY_HOME/skills"
  CLAUDE_CONFIG="$CLAUDE_GATEWAY_HOME" bash "$SKILLS_REPO/scripts/install-adapters.sh" --tool claude
  OPENCODE_CONFIG="$OPENCODE_GATEWAY_HOME" bash "$SKILLS_REPO/scripts/install-adapters.sh" --tool opencode
else
  echo "Clone skills repo first: git clone https://github.com/rahulnakmol/skills.git $SKILLS_REPO" >&2
  exit 1
fi

if command -v npx >/dev/null 2>&1; then
  echo "==> Third-party: mattpocock/skills"
  npx skills@latest add mattpocock/skills --skill=setup-matt-pocock-skills || true
fi

if [[ -x "$HOME/.local/bin/claude" ]]; then
  echo "==> Third-party: caveman plugin"
  "$HOME/.local/bin/claude" plugins install caveman || true
else
  echo "Skip Claude plugin: run scripts/setup-private-ai-gateway.sh first so installation targets the isolated gateway home."
fi

echo "==> Done. Commit skills-lock.json in project repos after npx skills add."
