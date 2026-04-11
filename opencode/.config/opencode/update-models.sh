#!/usr/bin/env bash
# update-models.sh — fetch latest Zen model IDs and patch opencode.json
# Usage:  ./update-models.sh [--dry-run]
set -euo pipefail

CONFIG="$HOME/.config/opencode/opencode.json"
ZEN_API="https://opencode.ai/zen/v1/models"
DRY_RUN=false
[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

# ── Preflight ────────────────────────────────────────────────────────────────
for cmd in curl jq; do
  command -v "$cmd" &>/dev/null || { echo "error: $cmd not found"; exit 1; }
done
[[ -f "$CONFIG" ]] || { echo "error: $CONFIG not found"; exit 1; }

# ── Fetch models ─────────────────────────────────────────────────────────────
models=$(curl -sS "$ZEN_API" | jq -r '.data[].id')

pick_latest() {
  local pattern="$1"
  echo "$models" | grep -E "$pattern" | sort -V | tail -1
}

# ── Resolve latest model for each slot ───────────────────────────────────────
new_model=$(pick_latest '^opencode/claude-sonnet-[0-9]')
new_small=$(pick_latest '^opencode/gpt-[0-9]+-nano')
new_pro=$(pick_latest '^opencode/claude-opus-[0-9]')
new_ui=$(pick_latest '^opencode/gemini-[0-9.]+-pro')
new_quick=$(pick_latest '^opencode/minimax-m[0-9]' | grep -v free || true)

# ── Current values ───────────────────────────────────────────────────────────
cur_model=$(jq -r '.model' "$CONFIG")
cur_small=$(jq -r '.small_model' "$CONFIG")
cur_pro=$(jq -r '.agent.pro.model' "$CONFIG")
cur_ui=$(jq -r '.agent.ui.model' "$CONFIG")
cur_quick=$(jq -r '.agent.quick.model' "$CONFIG")

# ── Diff ─────────────────────────────────────────────────────────────────────
changed=false
diff_line() {
  local label="$1" cur="$2" new="$3"
  if [[ "$cur" != "$new" && -n "$new" ]]; then
    echo "  $label: $cur → $new"
    changed=true
  fi
}

echo "Checking for model updates..."
diff_line "model       " "$cur_model" "$new_model"
diff_line "small_model " "$cur_small" "$new_small"
diff_line "agent.pro   " "$cur_pro"   "$new_pro"
diff_line "agent.ui    " "$cur_ui"    "$new_ui"
diff_line "agent.quick " "$cur_quick" "$new_quick"

if ! $changed; then
  echo "All models are up to date."
  exit 0
fi

if $DRY_RUN; then
  echo "(dry-run — no changes written)"
  exit 0
fi

# ── Apply ────────────────────────────────────────────────────────────────────
tmp=$(mktemp)
jq \
  --arg m  "${new_model:-$cur_model}" \
  --arg sm "${new_small:-$cur_small}" \
  --arg p  "${new_pro:-$cur_pro}" \
  --arg u  "${new_ui:-$cur_ui}" \
  --arg q  "${new_quick:-$cur_quick}" \
  '.model=$m | .small_model=$sm | .agent.pro.model=$p | .agent.ui.model=$u | .agent.quick.model=$q' \
  "$CONFIG" > "$tmp"
mv "$tmp" "$CONFIG"
echo "Updated $CONFIG"
echo ""
echo "Note: tmux model references in tmux.conf must be updated manually."
