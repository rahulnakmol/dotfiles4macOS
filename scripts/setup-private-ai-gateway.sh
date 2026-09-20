#!/usr/bin/env bash
# Configure one per-user private AI gateway for the CLI versions of Claude
# Code, Codex, and OpenCode. Cursor CLI is deliberately excluded because its
# credential authenticates to Cursor's own service, not a generic provider.
set -euo pipefail

CONFIG_DIR="${PRIVATE_AI_GATEWAY_CONFIG_DIR:-$HOME/.config/private-ai-gateway}"
ENDPOINT_FILE="$CONFIG_DIR/endpoint"
KEY_FILE="$CONFIG_DIR/client.key"
MODEL_FILE="$CONFIG_DIR/default-model"
MODEL_ALIASES_FILE="$CONFIG_DIR/model-aliases.json"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
CODEX_HOME="${PRIVATE_AI_GATEWAY_CODEX_HOME:-$HOME/.codex-aigateway}"
CODEX_TEMPLATE="$ROOT/scripts/templates/codex-aigateway-config.toml"
CODEX_MODULE="$ROOT/codex-aigateway/.codex-aigateway"
CLAUDE_HOME="$CONFIG_DIR/claude"
OPENCODE_HOME="$CONFIG_DIR/opencode"
OPENCODE_CONFIG="$OPENCODE_HOME/opencode.json"
BIN_DIR="${PRIVATE_AI_GATEWAY_BIN_DIR:-$HOME/.local/bin}"
MODE=setup
ROTATE_KEY=0
USER_NAME="$(id -un)"

usage() {
  echo "Usage: $0 [--status | --rotate-key]"
  echo 'Endpoint and key values are intentionally never accepted as arguments.'
}

case "${1:-}" in
  '') ;;
  --status) MODE=status ;;
  --rotate-key) ROTATE_KEY=1 ;;
  -h|--help) usage; exit 0 ;;
  *) usage >&2; exit 2 ;;
esac
[[ $# -le 1 ]] || { usage >&2; exit 2; }

file_mode() {
  local mode
  mode="$(stat -f '%Lp' "$1" 2>/dev/null || true)"
  [[ "$mode" =~ ^[0-7]{3,4}$ ]] || mode="$(stat -c '%a' "$1")"
  printf '%s\n' "$mode"
}

status() {
  local failed=0 name file
  for name in endpoint key model aliases; do
    case "$name" in
      endpoint) file="$ENDPOINT_FILE" ;;
      key) file="$KEY_FILE" ;;
      model) file="$MODEL_FILE" ;;
      aliases) file="$MODEL_ALIASES_FILE" ;;
    esac
    if [[ -s "$file" ]]; then
      printf 'gateway %-8s present (mode %s)\n' "$name:" "$(file_mode "$file")"
      [[ "$(file_mode "$file")" == 600 ]] || failed=1
    else
      printf 'gateway %-8s absent\n' "$name:"
      failed=1
    fi
  done
  for name in claude codex opencode gateway-model; do
    if [[ -x "$BIN_DIR/$name" ]]; then printf '%-16s configured\n' "$name"; else printf '%-16s absent\n' "$name"; failed=1; fi
  done
  if [[ -x "$BIN_DIR/chatgpt-aigateway" ]]; then printf '%-20s configured\n' chatgpt-aigateway; else printf '%-20s absent\n' chatgpt-aigateway; failed=1; fi
  if [[ -d "$CODEX_HOME" ]]; then
    printf 'codex gateway home   present (mode %s)\n' "$(file_mode "$CODEX_HOME")"
    [[ "$(file_mode "$CODEX_HOME")" == 700 ]] || failed=1
  else
    echo 'codex gateway home   absent'
    failed=1
  fi
  if [[ -e "$BIN_DIR/cursor-agent" ]]; then
    echo 'cursor-agent     unmanaged (official Cursor account retained)'
  else
    echo 'cursor-agent     excluded (official Cursor account retained)'
  fi
  return "$failed"
}

if [[ "$MODE" == status ]]; then status; exit; fi
[[ "$(uname -s)" == Darwin ]] || { echo 'Private gateway setup supports macOS only.' >&2; exit 1; }

find_vendor_binary() {
  local name="$1" candidate path_without_local
  for candidate in "/opt/homebrew/bin/$name" "/usr/local/bin/$name"; do
    [[ -x "$candidate" && "$candidate" != "$BIN_DIR/$name" ]] && { printf '%s\n' "$candidate"; return; }
  done
  if [[ "$name" == codex ]]; then
    for candidate in "/Applications/ChatGPT.app/Contents/Resources/codex" "$HOME/Applications/ChatGPT.app/Contents/Resources/codex"; do
      [[ -x "$candidate" ]] && { printf '%s\n' "$candidate"; return; }
    done
  fi
  path_without_local="$(printf '%s' "$PATH" | tr ':' '\n' | grep -vxF "$BIN_DIR" | paste -sd: -)"
  candidate="$(PATH="$path_without_local" command -v "$name" 2>/dev/null || true)"
  [[ -n "$candidate" && -x "$candidate" && "$candidate" != "$BIN_DIR/$name" ]] || return 1
  printf '%s\n' "$candidate"
}

claude_bin="$(find_vendor_binary claude)" || { echo 'Claude Code CLI not found. Install it with Homebrew first.' >&2; exit 1; }
codex_bin="$(find_vendor_binary codex)" || { echo 'Codex CLI not found. Install ChatGPT or Codex CLI first.' >&2; exit 1; }
opencode_bin="$(find_vendor_binary opencode)" || { echo 'OpenCode CLI not found. Install it with Homebrew first.' >&2; exit 1; }

install -d -m 0700 "$CONFIG_DIR" "$CODEX_HOME" "$CODEX_HOME/rules" "$CLAUDE_HOME" "$OPENCODE_HOME" "$BIN_DIR"
umask 077

if [[ -s "$ENDPOINT_FILE" ]]; then
  gateway_url="$(<"$ENDPOINT_FILE")"
else
  [[ -t 0 ]] || { echo 'Run interactively to enter the gateway endpoint.' >&2; exit 1; }
  IFS= read -r -p 'Private AI gateway HTTPS endpoint (without /v1): ' gateway_url
fi
gateway_url="${gateway_url%/}"
gateway_url="${gateway_url%/v1}"
[[ "$gateway_url" =~ ^https://[A-Za-z0-9._~%:-]+(/[A-Za-z0-9._~%/+:-]*)?$ ]] || {
  echo 'Gateway endpoint must be a plain HTTPS origin or path without query parameters.' >&2
  exit 1
}

key=''
if [[ -s "$KEY_FILE" && "$ROTATE_KEY" == 0 ]]; then
  key="$(<"$KEY_FILE")"
  echo "Reusing the existing protected gateway key for $USER_NAME."
else
  [[ -t 0 ]] || { echo 'Run interactively to enter the gateway key.' >&2; exit 1; }
  IFS= read -r -s -p "Gateway key for $USER_NAME (input hidden): " key
  printf '\n'
  [[ -n "$key" ]] || { echo 'Key cannot be empty.' >&2; exit 1; }
fi

models_json="$({
  printf 'header = "Authorization: Bearer %s"\n' "$key"
  printf 'silent\nshow-error\nfail\nmax-time = 30\n'
} | curl --config - "$gateway_url/v1/models")"
if ! jq -e '.data | type == "array" and length > 0 and all(.[]; .id | type == "string" and length > 0)' >/dev/null <<<"$models_json"; then
  echo 'Gateway returned an invalid or empty model catalog.' >&2
  exit 1
fi

if [[ -s "$MODEL_FILE" ]]; then
  default_model="$(<"$MODEL_FILE")"
else
  [[ -t 0 ]] || { echo 'Run interactively to select the default model.' >&2; exit 1; }
  models=()
  while IFS= read -r model; do models+=("$model"); done < <(jq -r '.data[].id' <<<"$models_json" | sort -u)
  echo 'Available models:'
  select default_model in "${models[@]}"; do [[ -n "$default_model" ]] && break; done
fi
if ! jq -e --arg model "$default_model" 'any(.data[]; .id == $model)' >/dev/null <<<"$models_json"; then
  echo "The saved default model is no longer advertised by the gateway; remove $MODEL_FILE and rerun." >&2
  exit 1
fi

provider_models="$(jq -c '.data | map(.id) | unique | sort | map({key:., value:{}}) | from_entries' <<<"$models_json")"
model_count="$(jq '[.data[].id] | unique | length' <<<"$models_json")"
gateway_json="$(jq -Rn --arg value "$gateway_url" '$value')"
model_json="$(jq -Rn --arg value "$default_model" '$value')"
key_file_json="$(jq -Rn --arg value "$KEY_FILE" '$value')"

if [[ -s "$MODEL_ALIASES_FILE" ]]; then
  if ! jq -e --argjson catalog "$(jq '[.data[].id] | unique' <<<"$models_json")" '
      type == "object" and
      all(to_entries[];
        (.key | IN("fable", "astra", "sol", "grok")) and
        (.value | type == "string") and
        (.value as $value | $catalog | index($value))
      )
    ' "$MODEL_ALIASES_FILE" >/dev/null; then
    echo "Saved model aliases are invalid or no longer advertised; update $MODEL_ALIASES_FILE and rerun." >&2
    exit 1
  fi
  aliases_json="$(jq -c . "$MODEL_ALIASES_FILE")"
elif [[ -t 0 ]]; then
  aliases_json='{}'
  models=()
  while IFS= read -r model; do models+=("$model"); done < <(jq -r '.data[].id' <<<"$models_json" | sort -u)
  for alias_name in fable astra sol grok; do
    echo "Select the authenticated model for '$alias_name' (or Skip if unavailable):"
    select alias_model in "${models[@]}" Skip; do [[ -n "$alias_model" ]] && break; done
    [[ "$alias_model" == Skip ]] || aliases_json="$(jq -c --arg name "$alias_name" --arg model "$alias_model" '. + {($name):$model}' <<<"$aliases_json")"
  done
else
  echo "Missing $MODEL_ALIASES_FILE. Run interactively once to map Fable/Astra/Sol/Grok to advertised model IDs." >&2
  exit 1
fi
printf '%s\n' "$gateway_url" >"$ENDPOINT_FILE"
printf '%s\n' "$key" >"$KEY_FILE"
printf '%s\n' "$default_model" >"$MODEL_FILE"
printf '%s\n' "$aliases_json" >"$MODEL_ALIASES_FILE"
unset key aliases_json
chmod 0600 "$ENDPOINT_FILE" "$KEY_FILE" "$MODEL_FILE" "$MODEL_ALIASES_FILE"

[[ -f "$CODEX_TEMPLATE" ]] || { echo 'Missing tracked Codex gateway template.' >&2; exit 1; }
sed \
  -e "s|__PRIVATE_AI_GATEWAY_MODEL__|$model_json|" \
  -e "s|__PRIVATE_AI_GATEWAY_BASE_URL__|${gateway_json%\"}/v1\"|" \
  -e "s|__PRIVATE_AI_GATEWAY_KEY_FILE__|$key_file_json|" \
  "$CODEX_TEMPLATE" >"$CODEX_HOME/config.toml"

link_codex_policy() {
  local relative="$1" source destination
  source="$CODEX_MODULE/$relative"
  destination="$CODEX_HOME/$relative"
  [[ -f "$source" ]] || { echo "Missing tracked Codex gateway file: $relative" >&2; exit 1; }
  if [[ -L "$destination" && "$(readlink "$destination")" == "$source" ]]; then return; fi
  if [[ -e "$destination" || -L "$destination" ]]; then
    echo "Refusing to replace existing gateway Codex file: $destination" >&2
    exit 1
  fi
  ln -s "$source" "$destination"
}
for managed in AGENTS.md hooks.json keybindings.json rules/dotfiles.rules; do link_codex_policy "$managed"; done

jq -n \
  --arg base "$gateway_url/v1" \
  --arg key_file "$KEY_FILE" \
  --arg default_model "$default_model" \
  --argjson models "$provider_models" \
  '{
    "$schema":"https://opencode.ai/config.json",
    enabled_providers:["private_gateway"],
    provider:{private_gateway:{
      npm:"@ai-sdk/openai-compatible",
      name:"Private AI gateway",
      options:{baseURL:$base,apiKey:("{file:" + $key_file + "}")},
      models:$models
    }},
    model:("private_gateway/" + $default_model)
  }' >"$OPENCODE_CONFIG"
chmod 0600 "$CODEX_HOME/config.toml" "$OPENCODE_CONFIG"

write_wrapper() {
  local path="$1" body="$2"
  printf '#!/usr/bin/env bash\nset -euo pipefail\n%s\n' "$body" >"$path"
  chmod 0700 "$path"
}
printf -v claude_body '%s\n%s\n%s\n%s' \
  "export ANTHROPIC_BASE_URL='$gateway_url'" \
  "export CLAUDE_CONFIG_DIR='$CLAUDE_HOME'" \
  "export ANTHROPIC_AUTH_TOKEN=\$(<'$KEY_FILE')" \
  "exec '$claude_bin' \"\$@\""
write_wrapper "$BIN_DIR/claude" "$claude_body"
printf -v codex_body '%s\n%s\n%s\n%s\n%s' \
  'unset CODEX_ACCESS_TOKEN CODEX_SQLITE_HOME CODEX_ELECTRON_USER_DATA_PATH CODEX_PROFILE_NAME' \
  "export CODEX_HOME='$CODEX_HOME'" \
  'export CODEX_PROFILE_NAME=aigateway' \
  'export CODEX_PROFILE_NO_UPDATE_CHECK=1' \
  "exec '$codex_bin' \"\$@\""
write_wrapper "$BIN_DIR/codex" "$codex_body"
printf -v opencode_body '%s\n%s\n%s' \
  "export OPENCODE_CONFIG='$OPENCODE_CONFIG'" \
  "export OPENCODE_CONFIG_DIR='$OPENCODE_HOME'" \
  "exec '$opencode_bin' \"\$@\""
write_wrapper "$BIN_DIR/opencode" "$opencode_body"

# Generic non-secret model router used by shell functions and long-lived tmux servers.
# The single-quoted fragments intentionally expand only when the generated wrapper runs.
# shellcheck disable=SC2016
printf -v gateway_model_body '%s\n%s\n%s\n%s\n%s\n%s\n%s' \
  '[[ $# -ge 2 ]] || { echo "Usage: gateway-model claude|codex fable|astra|sol|grok [args...]" >&2; exit 2; }' \
  'client="$1"; alias_name="$2"; shift 2' \
  "mapping='$MODEL_ALIASES_FILE'" \
  'case "$client" in claude|codex) ;; *) echo "Unsupported gateway client: $client" >&2; exit 2;; esac' \
  'model="$(jq -er --arg name "$alias_name" '\''.[$name] // empty'\'' "$mapping" 2>/dev/null)" || { echo "Gateway model alias '\''$alias_name'\'' is unavailable; rerun scripts/setup-private-ai-gateway.sh." >&2; exit 1; }' \
  'export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"' \
  'exec "$client" --model "$model" "$@"'
write_wrapper "$BIN_DIR/gateway-model" "$gateway_model_body"

# The generated launcher, not setup, expands its own HOME and PATH.
# shellcheck disable=SC2016
printf -v gateway_desktop_body '%s\n%s\n%s\n%s\n%s' \
  'unset CODEX_HOME CODEX_ACCESS_TOKEN CODEX_SQLITE_HOME CODEX_ELECTRON_USER_DATA_PATH CODEX_PROFILE_NAME' \
  'export CODEX_PROFILE_NO_UPDATE_CHECK=1' \
  'export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"' \
  'command -v codex-profile >/dev/null || { echo "codex-profile is not installed; run scripts/setup-codex-profiles.sh" >&2; exit 1; }' \
  'exec codex-profile app aigateway "$@"'
write_wrapper "$BIN_DIR/chatgpt-aigateway" "$gateway_desktop_body"

rm -f "$BIN_DIR/claude-direct" "$BIN_DIR/codex-direct" "$BIN_DIR/opencode-direct"

if command -v herdr >/dev/null 2>&1; then
  CLAUDE_CONFIG_DIR="$CLAUDE_HOME" herdr integration install claude >/dev/null
  CODEX_HOME="$CODEX_HOME" herdr integration install codex >/dev/null
  herdr_stage="$(mktemp -d "${TMPDIR:-/tmp}/private-ai-gateway-herdr.XXXXXX")"
  cleanup_herdr_stage() { [[ -n "${herdr_stage:-}" ]] && rm -rf "$herdr_stage"; }
  trap cleanup_herdr_stage EXIT
  install -d -m 0700 "$herdr_stage/.config/opencode"
  HOME="$herdr_stage" herdr integration install opencode >/dev/null
  cp -R "$herdr_stage/.config/opencode/." "$OPENCODE_HOME/"
  chmod -R go-rwx "$OPENCODE_HOME"
  rm -rf "$herdr_stage"
  herdr_stage=''
  trap - EXIT
fi

echo "Configured gateway-backed Claude Code, Codex, and OpenCode CLIs for $USER_NAME."
echo "OpenCode catalog: $model_count authenticated gateway models."
status
