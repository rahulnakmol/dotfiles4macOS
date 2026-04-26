#!/usr/bin/env bash
# Claude Code statusline — Catppuccin Macchiato palette
# Called by settings.json → statusLine.command

set -euo pipefail

# ── Catppuccin Macchiato ANSI 24-bit colors ──────────────────────────────────
C_RESET=$'\033[0m'
C_MAUVE=$'\033[38;2;198;160;246m'
C_PEACH=$'\033[38;2;245;169;127m'
C_GREEN=$'\033[38;2;166;218;149m'
C_RED=$'\033[38;2;237;135;150m'
C_BLUE=$'\033[38;2;138;173;244m'
C_LAVENDER=$'\033[38;2;183;189;248m'
C_TEXT=$'\033[38;2;202;211;245m'
C_SUBTEXT=$'\033[38;2;184;192;224m'
C_SURFACE=$'\033[38;2;91;96;120m'

# ── Read JSON from stdin ─────────────────────────────────────────────────────
json=$(cat)

model=$(echo "$json" | jq -r '.model.display_name // .model.id // empty')
cwd=$(echo "$json" | jq -r '.workspace.current_dir // .cwd // empty')
vim_mode=$(echo "$json" | jq -r '.vim.mode // empty')
tokens_in=$(echo "$json" | jq -r '.context_window.total_input_tokens // 0')
tokens_out=$(echo "$json" | jq -r '.context_window.total_output_tokens // 0')
tokens_used=$(( tokens_in + tokens_out ))
tokens_max=$(echo "$json" | jq -r '.context_window.context_window_size // 0')

# ── Format model ─────────────────────────────────────────────────────────────
if [[ -n "$model" ]]; then
  model_str="${C_MAUVE}${model}${C_RESET}"
else
  model_str="${C_SURFACE}--${C_RESET}"
fi

# ── Format directory ─────────────────────────────────────────────────────────
if [[ -n "$cwd" ]]; then
  if (( ${#cwd} > 40 )); then
    cwd="${cwd##*/}"
  fi
  dir_str="${C_LAVENDER}${cwd}${C_RESET}"
else
  dir_str=""
fi

# ── Git branch ───────────────────────────────────────────────────────────────
branch=""
if command -v git &>/dev/null && [[ -n "$cwd" ]]; then
  branch=$(git -C "$cwd" rev-parse --abbrev-ref HEAD 2>/dev/null || true)
fi
if [[ -n "$branch" ]]; then
  dirty=$(git -C "$cwd" status --porcelain 2>/dev/null | head -1)
  if [[ -n "$dirty" ]]; then
    git_str="${C_PEACH}${branch}·${C_RESET}"
  else
    git_str="${C_GREEN}${branch}${C_RESET}"
  fi
else
  git_str=""
fi

# ── Vim mode ─────────────────────────────────────────────────────────────────
if [[ "$vim_mode" == "NORMAL" ]]; then
  vim_str="${C_GREEN}N${C_RESET}"
elif [[ "$vim_mode" == "INSERT" ]]; then
  vim_str="${C_BLUE}I${C_RESET}"
else
  vim_str=""
fi

# ── Context window ───────────────────────────────────────────────────────────
if (( tokens_max > 0 )); then
  remaining=$(( tokens_max - tokens_used ))
  pct=$(( remaining * 100 / tokens_max ))

  if (( tokens_used >= 1000000 )); then
    used_fmt="$(( tokens_used / 1000000 ))M"
  elif (( tokens_used >= 1000 )); then
    used_fmt="$(( tokens_used / 1000 ))k"
  else
    used_fmt="$tokens_used"
  fi

  if (( pct > 50 )); then
    ctx_color="$C_GREEN"
  elif (( pct > 20 )); then
    ctx_color="$C_PEACH"
  else
    ctx_color="$C_RED"
  fi
  ctx_str="${ctx_color}${used_fmt}${C_RESET}"
else
  ctx_str=""
fi

# ── Assemble ─────────────────────────────────────────────────────────────────
parts=()
[[ -n "$model_str" ]] && parts+=("$model_str")
[[ -n "$dir_str" ]] && parts+=("$dir_str")
[[ -n "$git_str" ]] && parts+=("$git_str")
[[ -n "$vim_str" ]] && parts+=("$vim_str")
[[ -n "$ctx_str" ]] && parts+=("$ctx_str")

sep="${C_SURFACE} │ ${C_RESET}"
out=""
for i in "${!parts[@]}"; do
  (( i > 0 )) && out+="$sep"
  out+="${parts[$i]}"
done

echo -n "$out"
