#!/usr/bin/env bash
# Launch evidence-based model curation, or audit configured IDs without edits.
set -euo pipefail

SCRIPT_PATH="$(perl -MCwd=abs_path -e 'print abs_path(shift)' "$0")"
CONFIG_DIR="$(dirname "$SCRIPT_PATH")"
ROOT="$(git -C "$CONFIG_DIR" rev-parse --show-toplevel 2>/dev/null || true)"
ZEN_API="https://opencode.ai/zen/v1/models"
MODELS_API="https://models.dev/api.json"

usage() {
  cat <<'EOF'
Usage: update-models.sh [--research | --dry-run | --help]

  --research  Launch model-curator for sourced, evidence-based updates (default)
  --dry-run   Audit configured model IDs and reasoning variants
  --help      Show this help
EOF
}

audit_models() {
  for cmd in curl jq awk; do
    command -v "$cmd" >/dev/null 2>&1 || {
      printf 'error: %s not found\n' "$cmd" >&2
      exit 1
    }
  done

  local config="$CONFIG_DIR/opencode.json"
  local agents="$CONFIG_DIR/agents"
  local commands="$CONFIG_DIR/commands"
  local zen_models catalog metadata refs variants status=0

  [[ -f "$config" ]] || {
    printf 'error: %s not found\n' "$config" >&2
    exit 1
  }

  zen_models="$(curl -fsSL "$ZEN_API" | jq -r '.data[].id')"
  metadata="$(curl -fsSL "$MODELS_API")"
  if command -v opencode >/dev/null 2>&1; then
    catalog="$(opencode models 2>/dev/null || true)"
  fi
  catalog="${catalog:-$(printf '%s\n' "$zen_models" | sed 's|^|opencode/|')}"
  refs="$({
    jq -r '[.model, .small_model] | .[] | select(type == "string")' "$config"
    awk '/^model:[[:space:]]*/ { sub(/^model:[[:space:]]*/, ""); print }' "$agents"/*.md 2>/dev/null || true
    awk '/^model:[[:space:]]*/ { sub(/^model:[[:space:]]*/, ""); print }' "$commands"/*.md 2>/dev/null || true
  } | sort -u)"
  variants="$({
    local file model variant
    for file in "$agents"/*.md "$commands"/*.md; do
      [[ -f "$file" ]] || continue
      model="$(awk '/^model:[[:space:]]*/ { sub(/^model:[[:space:]]*/, ""); print; exit }' "$file")"
      variant="$(awk '/^variant:[[:space:]]*/ { sub(/^variant:[[:space:]]*/, ""); print; exit }' "$file")"
      [[ -n "$model" && -n "$variant" ]] && printf '%s\t%s\t%s\n' "$file" "$model" "$variant"
    done
    true
  } | sort -u)"

  printf 'Model availability audit\n'
  while IFS= read -r model; do
    [[ -n "$model" ]] || continue
    local provider="${model%%/*}"
    local id="${model#*/}"

    if grep -Fxq "$model" <<<"$catalog"; then
      printf '  OK      %s\n' "$model"
    else
      printf '  MISSING %s\n' "$model"
      status=1
    fi
  done <<<"$refs"

  printf '\nReasoning variant audit\n'
  while IFS=$'\t' read -r file model variant; do
    [[ -n "$file" ]] || continue
    local provider="${model%%/*}"
    local id="${model#*/}"
    local supported
    supported="$(jq -r \
      --arg provider "$provider" \
      --arg id "$id" \
      '.[$provider].models[$id].reasoning_options // []
       | map(select(.type == "effort") | .values[])
       | .[]' <<<"$metadata")"

    if grep -Fxq "$variant" <<<"$supported"; then
      printf '  OK      %s (%s)\n' "$model" "$variant"
    else
      printf '  INVALID %s (%s) in %s\n' "$model" "$variant" "${file#"$ROOT"/}"
      printf '          supported: %s\n' "${supported//$'\n'/, }"
      status=1
    fi
  done <<<"$variants"

  printf '\nResearch candidates before changing assignments:\n'
  printf '%s\n' "$catalog" | grep -E '/(claude-(sonnet|opus)|gpt-|kimi-|gemini-)' | sort -V | sed 's/^/  /'

  if (( status != 0 )); then
    printf '\nAudit failed: unavailable model or unsupported variant found.\n' >&2
    return "$status"
  fi
  printf '\nAll configured model IDs and variants are valid.\n'
}

run_research() {
  command -v opencode >/dev/null 2>&1 || {
    printf 'error: opencode not found\n' >&2
    exit 1
  }
  [[ -n "$ROOT" ]] || {
    printf 'error: cannot locate dotfiles git root from %s\n' "$CONFIG_DIR" >&2
    exit 1
  }

  exec env XDG_CONFIG_HOME="$(dirname "$CONFIG_DIR")" opencode run \
    --dir "$ROOT" \
    --agent model-curator \
    "Audit and update OpenCode model and reasoning-variant assignments. Run full evidence-based workflow, including live provider availability, Models.dev effort metadata, official release sources, dry-run audit, constrained edits, validation, and model-research.md update."
}

case "${1:---research}" in
  --research) run_research ;;
  --dry-run|--check) audit_models ;;
  --help|-h) usage ;;
  *)
    usage >&2
    exit 2
    ;;
esac
