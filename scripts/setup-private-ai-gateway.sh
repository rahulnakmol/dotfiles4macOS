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
PROTOCOL_MODELS_FILE="$CONFIG_DIR/protocol-models.json"
CODEX_HOME_FILE="$CONFIG_DIR/codex-home"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)"
CODEX_HOME="${PRIVATE_AI_GATEWAY_CODEX_HOME:-$CONFIG_DIR/codex}"
CODEX_TEMPLATE="$ROOT/scripts/templates/codex-aigateway-config.toml"
CODEX_MODULE="$ROOT/codex-aigateway/.codex-aigateway"
CLAUDE_HOME="$CONFIG_DIR/claude"
OPENCODE_HOME="$CONFIG_DIR/opencode"
OPENCODE_CONFIG="$OPENCODE_HOME/opencode.json"
BIN_DIR="${PRIVATE_AI_GATEWAY_BIN_DIR:-$HOME/.local/bin}"
MODE=setup
ROTATE_KEY=0
REFRESH_LABEL='com.rahulnakmol.private-ai-gateway-refresh'
REFRESH_PLIST="$HOME/Library/LaunchAgents/$REFRESH_LABEL.plist"
USER_NAME="$(id -un)"

usage() {
  echo "Usage: $0 [--status | --rotate-key | --refresh | --install-refresh | --remove-refresh]"
  echo 'Endpoint and key values are intentionally never accepted as arguments.'
}

print_journey() {
  cat <<EOF
Private AI gateway setup

This command will:
  1. Check the tracked Claude and OpenCode Stow modules.
  2. Validate the gateway endpoint, key, and authenticated model catalog.
  3. Automatically choose and test working Anthropic Messages, Chat Completions,
     and Responses models. There is no model-number prompt.
  4. Deploy the reviewed Claude/OpenCode dotfiles modules, then generate isolated
     gateway state and wrappers. Existing conflicting files are never overwritten.
  5. Print every generated, linked, skipped, and follow-up path.

Claude and OpenCode tracked modules are deployed automatically when needed.
Setup previews Stow first and stops rather than overwriting a conflicting path.

Do not manually Stow codex over an existing home. The separate Codex setup
switches the single desktop home while keeping the CLI gateway isolated:
  bash scripts/setup-codex-profiles.sh --mode subscription|gateway
EOF
}

report_stow_module() {
  local module="$1" target="$2" expected
  expected="$ROOT/$module/$target"
  if [[ -e "$HOME/$target" && "$HOME/$target" -ef "$expected" ]]; then
    printf '  %-10s linked: %s -> %s\n' "$module" "$HOME/$target" "$expected"
  elif [[ -e "$HOME/$target" || -L "$HOME/$target" ]]; then
    printf '  %-10s not Stow-linked (existing path retained): %s\n' "$module" "$HOME/$target"
  else
    printf '  %-10s not deployed: %s\n' "$module" "$HOME/$target"
  fi
}

ensure_stow_module() {
  local module="$1" target="$2" expected already_managed=0
  expected="$ROOT/$module/$target"
  if [[ -e "$HOME/$target" && "$HOME/$target" -ef "$expected" ]]; then
    already_managed=1
  fi
  command -v stow >/dev/null 2>&1 || {
    echo "GNU Stow is required to deploy the tracked $module module: brew install stow" >&2
    exit 1
  }
  echo "Previewing tracked $module module before deployment..."
  if ! stow -n --no-folding -d "$ROOT" -t "$HOME" "$module"; then
    echo "Cannot deploy the tracked $module module because existing files conflict." >&2
    echo "Review $ROOT/$module and the reported paths under $HOME, back up personal files, then rerun." >&2
    exit 1
  fi
  stow --no-folding -d "$ROOT" -t "$HOME" "$module"
  [[ -e "$HOME/$target" && "$HOME/$target" -ef "$expected" ]] || {
    echo "Stow completed but the expected $module link was not created: $HOME/$target" >&2
    exit 1
  }
  if [[ "$already_managed" == 1 ]]; then
    echo "Verified and refreshed tracked $module Stow links."
  else
    echo "Deployed tracked $module module into $HOME."
  fi
}

case "${1:-}" in
  '') ;;
  --status) MODE=status ;;
  --rotate-key) ROTATE_KEY=1 ;;
  --refresh) MODE=refresh ;;
  --install-refresh) MODE=install-refresh ;;
  --remove-refresh) MODE=remove-refresh ;;
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
  for name in endpoint key model aliases protocols; do
    case "$name" in
      endpoint) file="$ENDPOINT_FILE" ;;
      key) file="$KEY_FILE" ;;
      model) file="$MODEL_FILE" ;;
      aliases) file="$MODEL_ALIASES_FILE" ;;
      protocols) file="$PROTOCOL_MODELS_FILE" ;;
    esac
    if [[ -s "$file" ]]; then
      printf 'gateway %-8s present (mode %s)\n' "$name:" "$(file_mode "$file")"
      [[ "$(file_mode "$file")" == 600 ]] || failed=1
    else
      printf 'gateway %-8s absent\n' "$name:"
      failed=1
    fi
  done
  for name in claude codex opencode; do
    if [[ -x "$BIN_DIR/$name" ]]; then printf '%-16s configured\n' "$name"; else printf '%-16s skipped (client is not installed)\n' "$name"; fi
  done
  if [[ -x "$BIN_DIR/gateway-model" ]]; then printf '%-16s configured\n' gateway-model; else printf '%-16s absent\n' gateway-model; failed=1; fi
  if [[ -d "$CODEX_HOME" ]]; then
    printf 'codex gateway config prepared (mode %s)\n' "$(file_mode "$CODEX_HOME")"
    [[ "$(file_mode "$CODEX_HOME")" == 700 ]] || failed=1
  else
    echo 'codex gateway config absent'
    failed=1
  fi
  if [[ -e "$BIN_DIR/cursor-agent" ]]; then
    echo 'cursor-agent     unmanaged (official Cursor account retained)'
  else
    echo 'cursor-agent     excluded (official Cursor account retained)'
  fi
  return "$failed"
}

install_refresh_agent() {
  local script_path log_path
  script_path="$ROOT/scripts/setup-private-ai-gateway.sh"
  log_path="$HOME/Library/Logs/private-ai-gateway/refresh.log"
  case "$script_path$log_path" in
    *'&'*|*'<'*|*'>'*|*'"'*|*"'"*) echo 'Checkout or home path contains XML punctuation; cannot create LaunchAgent safely.' >&2; return 1 ;;
  esac
  install -d -m 0700 "$HOME/Library/LaunchAgents" "$HOME/Library/Logs/private-ai-gateway"
  cat >"$REFRESH_PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$REFRESH_LABEL</string>
  <key>ProgramArguments</key><array><string>/bin/bash</string><string>$script_path</string><string>--refresh</string></array>
  <key>EnvironmentVariables</key><dict><key>PATH</key><string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string></dict>
  <key>StartInterval</key><integer>86400</integer>
  <key>RunAtLoad</key><false/>
  <key>StandardOutPath</key><string>$log_path</string>
  <key>StandardErrorPath</key><string>$log_path</string>
</dict></plist>
EOF
  chmod 0600 "$REFRESH_PLIST"
  launchctl bootout "gui/$(id -u)/$REFRESH_LABEL" 2>/dev/null || true
  launchctl bootstrap "gui/$(id -u)" "$REFRESH_PLIST"
  echo "Installed daily private gateway catalog refresh: $REFRESH_PLIST"
  echo 'Refresh reuses the protected endpoint/key and keeps the last working configuration when validation fails.'
}

remove_refresh_agent() {
  launchctl bootout "gui/$(id -u)/$REFRESH_LABEL" 2>/dev/null || true
  rm -f "$REFRESH_PLIST"
  echo "Removed private gateway catalog refresh: $REFRESH_PLIST"
}

if [[ "$MODE" == status ]]; then
  result=0
  status || result=$?
  if [[ -f "$REFRESH_PLIST" ]]; then echo 'automatic refresh installed (daily)'; else echo 'automatic refresh not installed'; fi
  exit "$result"
fi
[[ "$(uname -s)" == Darwin ]] || { echo 'Private gateway setup supports macOS only.' >&2; exit 1; }

if [[ "$MODE" == install-refresh ]]; then
  [[ -s "$ENDPOINT_FILE" && -s "$KEY_FILE" ]] || { echo 'Run private gateway setup successfully before installing automatic refresh.' >&2; exit 1; }
  install_refresh_agent
  exit
elif [[ "$MODE" == remove-refresh ]]; then
  remove_refresh_agent
  exit
fi

if [[ "$MODE" == setup ]]; then
  print_journey
  echo
  echo 'Tracked module status:'
  report_stow_module claude .claude/settings.json
  report_stow_module opencode .config/opencode/opencode.json
  echo '  codex      desktop uses the subscription home; terminal Codex uses the isolated gateway home'
  echo
  ensure_stow_module claude .claude/settings.json
  ensure_stow_module opencode .config/opencode/opencode.json
  echo
else
  echo 'Refreshing the authenticated private gateway catalog without prompting or rotating credentials.'
fi

if [[ "$MODE" == refresh ]]; then
  [[ -s "$ENDPOINT_FILE" && -s "$KEY_FILE" && -s "$CODEX_HOME/config.toml" ]] || {
    echo 'Automatic refresh skipped: the saved gateway setup is incomplete.' >&2
    exit 1
  }
fi

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

claude_bin="$(find_vendor_binary claude || true)"
codex_bin="$(find_vendor_binary codex || true)"
opencode_bin="$(find_vendor_binary opencode || true)"
[[ -n "$claude_bin" ]] || echo 'Claude Code CLI not found; gateway validation will continue and its wrapper will be skipped.'
[[ -n "$codex_bin" ]] || echo 'Codex CLI not found; gateway validation will continue and its wrapper will be skipped.'
[[ -n "$opencode_bin" ]] || echo 'OpenCode CLI not found; gateway validation will continue and its wrapper will be skipped.'

install -d -m 0700 "$CONFIG_DIR" "$CODEX_HOME" "$CODEX_HOME/rules" "$CLAUDE_HOME" "$OPENCODE_HOME" "$BIN_DIR"
umask 077
LOCK_DIR="$CONFIG_DIR/setup.lock"
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo 'Another gateway setup or refresh is running; wait for it to finish.' >&2
  exit 1
fi
cleanup_lock() { rmdir "$LOCK_DIR"; }
trap cleanup_lock EXIT

if [[ -s "$ENDPOINT_FILE" ]]; then
  gateway_url="$(<"$ENDPOINT_FILE")"
else
  [[ "$MODE" != refresh ]] || { echo 'Automatic refresh skipped: saved gateway endpoint is absent.' >&2; exit 1; }
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
  [[ "$MODE" != refresh ]] || { echo 'Automatic refresh skipped: saved gateway key is absent.' >&2; exit 1; }
  [[ -t 0 ]] || { echo 'Run interactively to enter the gateway key.' >&2; exit 1; }
  IFS= read -r -s -p "Gateway key for $USER_NAME (input hidden): " key
  printf '\n'
  [[ -n "$key" ]] || { echo 'Key cannot be empty.' >&2; exit 1; }
fi

models_error="$(mktemp "${TMPDIR:-/tmp}/private-ai-gateway-models.XXXXXX")"
cleanup_gateway() {
  rm -f "${models_error:-}" "${response_body:-}" "${response_error:-}"
  [[ -z "${herdr_stage:-}" ]] || rm -rf "$herdr_stage"
  cleanup_lock
}
trap cleanup_gateway EXIT
set +e
models_json="$({
  printf 'header = "Authorization: Bearer %s"\n' "$key"
  printf 'silent\nshow-error\nfail\nmax-time = 30\nconnect-timeout = 10\n'
} | curl --config - "$gateway_url/v1/models" 2>"$models_error")"
models_result=$?
set -e
if [[ "$models_result" -ne 0 ]]; then
  case "$models_result" in
    6) reason='DNS lookup failed' ;;
    7) reason='connection was refused or unreachable' ;;
    22) reason='the server rejected the request; check the endpoint and key' ;;
    28) reason='the request timed out' ;;
    35|60) reason='TLS validation failed' ;;
    *) reason="transport failed (curl exit $models_result)" ;;
  esac
  echo "Gateway model-catalog check failed: $reason." >&2
  echo "Checked: $gateway_url/v1/models" >&2
  echo 'No gateway credential or client configuration was changed. Verify HTTPS, network access, and the key, then rerun.' >&2
  exit 1
fi
if ! jq -e '.data | type == "array" and length > 0 and all(.[]; .id | type == "string" and length > 0)' >/dev/null <<<"$models_json"; then
  echo "Gateway model-catalog check failed: $gateway_url/v1/models returned an invalid or empty OpenAI-compatible catalog." >&2
  echo 'No gateway credential or client configuration was changed.' >&2
  exit 1
fi
rm -f "$models_error"
models_error=''

catalog_models="$(jq -r '.data[].id' <<<"$models_json" | sort -u)"

saved_protocol_models='{}'
if [[ -s "$PROTOCOL_MODELS_FILE" ]] && jq -e --argjson catalog "$(jq '[.data[].id] | unique' <<<"$models_json")" '
    type == "object" and
    (. as $document | ["anthropic", "chat", "responses"] | all(. as $key |
      ($document[$key] | type == "string") and
      ($document[$key] as $value | $catalog | index($value) != null)
    ))
  ' "$PROTOCOL_MODELS_FILE" >/dev/null; then
  saved_protocol_models="$(jq -c . "$PROTOCOL_MODELS_FILE")"
elif [[ -s "$PROTOCOL_MODELS_FILE" ]]; then
  echo 'Saved protocol models are no longer valid; discovering replacements automatically.'
fi

gateway_post_check() {
  local label="$1" path="$2" payload="$3" validation="$4" quiet="${5:-0}" max_time="${6:-45}" http_code curl_result reason
  response_body="$(mktemp "${TMPDIR:-/tmp}/private-ai-gateway-response.XXXXXX")"
  response_error="$(mktemp "${TMPDIR:-/tmp}/private-ai-gateway-error.XXXXXX")"
  set +e
  http_code="$({
    printf 'header = "Authorization: Bearer %s"\n' "$key"
    printf 'header = "anthropic-version: 2023-06-01"\n'
    printf 'silent\nshow-error\nmax-time = %s\nconnect-timeout = 10\n' "$max_time"
  } | curl --config - --request POST --header 'Content-Type: application/json' \
      --data "$payload" --output "$response_body" --write-out '%{http_code}' \
      "$gateway_url$path" 2>"$response_error")"
  curl_result=$?
  set -e
  if [[ "$curl_result" -ne 0 ]]; then
    case "$curl_result" in
      6) reason='DNS lookup failed' ;;
      7) reason='connection was refused or unreachable' ;;
      28) reason='the request timed out' ;;
      35|60) reason='TLS validation failed' ;;
      *) reason="transport failed (curl exit $curl_result)" ;;
    esac
    echo "$label check failed: $reason." >&2
  elif [[ ! "$http_code" =~ ^2 ]]; then
    case "$http_code" in
      401|403) reason='authentication was rejected; verify the gateway key and its permissions' ;;
      404) reason='the compatibility endpoint is not enabled at this gateway URL' ;;
      429) reason='the gateway is reachable but rate-limited or out of quota' ;;
      5*) reason='the gateway or upstream provider returned a server error' ;;
      *) reason="the gateway returned HTTP $http_code" ;;
    esac
    echo "$label check failed: $reason." >&2
  elif ! jq -e "$validation" "$response_body" >/dev/null 2>&1; then
    echo "$label check failed: HTTP $http_code did not contain the expected successful response shape." >&2
  else
    [[ "$quiet" == 1 ]] || echo "$label check passed ($path, HTTP $http_code)."
    rm -f "$response_body" "$response_error"
    response_body='' response_error=''
    return 0
  fi
  if [[ "$quiet" != 1 ]]; then
    echo "Checked: $gateway_url$path" >&2
    echo 'The response body was not printed because it may contain provider diagnostics. No gateway credential or client configuration was changed.' >&2
  fi
  rm -f "$response_body" "$response_error"
  response_body='' response_error=''
  return 1
}

protocol_candidates() {
  local protocol="$1" saved
  saved="$(jq -r --arg protocol "$protocol" '.[$protocol] // empty' <<<"$saved_protocol_models")"
  case "$protocol" in
    anthropic)
      # Anthropic's Messages API requires an Anthropic/Claude-family model.
      grep -Ei '(^|[/_.-])(claude|anthropic|opus|sonnet|haiku|fable)([/_.-]|$)' <<<"$catalog_models" || true
      ;;
    chat)
      # Prefer model families commonly served through Chat Completions. Claude is
      # intentionally absent: a catalog entry is not proof that the gateway
      # translates Anthropic models through OpenAI's Chat Completions surface.
      grep -Ei '(^|[/_.-])(gemini|grok|deepseek|qwen|mistral|llama|command-r|cohere|kimi|minimax|glm)([/_.-]|$)' <<<"$catalog_models" || true
      grep -Ei '(^|[/_.-])(chatgpt|gpt)([/_.-]|$)' <<<"$catalog_models" |
        grep -Eiv '(^|[/_.-])(codex|astra|sol)([/_.-]|$)' || true
      ;;
    responses)
      # Codex and the gateway's Astra/Sol OpenAI routes are the strongest
      # Responses signals. Try modern OpenAI reasoning families next, then
      # other GPT models only after the strongly classified candidates.
      grep -Ei '(^|[/_.-])(codex|astra|sol)([/_.-]|$)' <<<"$catalog_models" || true
      grep -Ei '(^|[/_.-])(gpt[-_.]?[5-9]|o[1-9])([/_.-]|$)' <<<"$catalog_models" || true
      grep -Ei '(^|[/_.-])(gpt|openai)([/_.-]|$)' <<<"$catalog_models" || true
      ;;
  esac | awk '!seen[$0]++' | {
    # Reuse a saved choice only when it still belongs to this protocol family.
    # Responses keeps Codex/Astra/Sol candidates ahead of a previously saved
    # generic GPT fallback, even when that older model happened to respond.
    # This repairs protocol-unsafe choices written by older setup versions.
    if [[ -n "$saved" && ( "$protocol" != responses || "$saved" =~ (^|[/_.-])(codex|astra|sol)([/_.-]|$) ) ]]; then
      awk -v saved="$saved" 'BEGIN { found=0 } $0 == saved { found=1 } { lines[NR]=$0 } END { if (found) print saved; for (i=1; i<=NR; i++) if (lines[i] != saved) print lines[i] }'
    else
      cat
    fi
  }
}

discover_protocol_model() {
  local protocol="$1" label family path validation model payload first_model='' attempt=0 candidates candidate_count max_candidates=30
  case "$protocol" in
    anthropic) label='Anthropic Messages API'; family='Claude/Anthropic'; path='/v1/messages'; validation='.content | type == "array"' ;;
    chat) label='OpenAI Chat Completions API'; family='Chat Completions'; path='/v1/chat/completions'; validation='.choices | type == "array" and length > 0' ;;
    responses) label='OpenAI Responses API'; family='Codex/Responses'; path='/v1/responses'; validation='.id | type == "string" and length > 0' ;;
  esac
  candidates="$(protocol_candidates "$protocol" | head -"$max_candidates")"
  candidate_count="$(awk 'NF { count++ } END { print count+0 }' <<<"$candidates")"
  if [[ "$candidate_count" == 0 ]]; then
    echo "$label check failed: the authenticated catalog advertises no recognized $family model family." >&2
    echo 'The setup will not guess that an unrelated catalog model supports this protocol.' >&2
    echo "Checked catalog: $gateway_url/v1/models" >&2
    echo 'No gateway credential or client configuration was changed.' >&2
    return 1
  fi
  echo "Auto-selecting a working model for $label..." >&2
  echo "  classified $candidate_count $family candidate(s) from the authenticated catalog" >&2
  while IFS= read -r model; do
    [[ -n "$model" ]] || continue
    attempt=$((attempt + 1))
    echo "  trying $model ($attempt/$candidate_count)..." >&2
    [[ -n "$first_model" ]] || first_model="$model"
    case "$protocol" in
      anthropic) payload="$(jq -nc --arg model "$model" '{model:$model,max_tokens:1,messages:[{role:"user",content:"Reply OK"}]}')" ;;
      chat) payload="$(jq -nc --arg model "$model" '{model:$model,max_tokens:1,messages:[{role:"user",content:"Reply OK"}]}')" ;;
      responses) payload="$(jq -nc --arg model "$model" '{model:$model,max_output_tokens:16,input:"Reply OK"}')" ;;
    esac
    if gateway_post_check "$label" "$path" "$payload" "$validation" 1 20 >/dev/null 2>&1; then
      echo "  selected $model" >&2
      printf '%s\n' "$model"
      return 0
    fi
  done <<<"$candidates"
  if [[ -n "$first_model" ]]; then
    case "$protocol" in
      anthropic) payload="$(jq -nc --arg model "$first_model" '{model:$model,max_tokens:1,messages:[{role:"user",content:"Reply OK"}]}')" ;;
      chat) payload="$(jq -nc --arg model "$first_model" '{model:$model,max_tokens:1,messages:[{role:"user",content:"Reply OK"}]}')" ;;
      responses) payload="$(jq -nc --arg model "$first_model" '{model:$model,max_output_tokens:16,input:"Reply OK"}')" ;;
    esac
    gateway_post_check "$label" "$path" "$payload" "$validation" 0 20 || true
  fi
  echo "$label check failed: all $candidate_count classified $family candidates were rejected or returned an incompatible response." >&2
  echo "Checked: $gateway_url$path" >&2
  echo 'No gateway credential or client configuration was changed.' >&2
  return 1
}

anthropic_model="$(discover_protocol_model anthropic)"
chat_model="$(discover_protocol_model chat)"
responses_model="$(discover_protocol_model responses)"
protocol_models_json="$(jq -nc --arg anthropic "$anthropic_model" --arg chat "$chat_model" --arg responses "$responses_model" '{anthropic:$anthropic,chat:$chat,responses:$responses}')"
default_model="$chat_model"

provider_models="$(jq -c '.data | map(.id) | unique | sort | map({key:., value:{}}) | from_entries' <<<"$models_json")"
model_count="$(jq '[.data[].id] | unique | length' <<<"$models_json")"
gateway_json="$(jq -Rn --arg value "$gateway_url" '$value')"
model_json="$(jq -Rn --arg value "$default_model" '$value')"
key_file_json="$(jq -Rn --arg value "$KEY_FILE" '$value')"

if [[ "$MODE" != refresh && -s "$MODEL_ALIASES_FILE" ]]; then
  if ! jq -e --argjson catalog "$(jq '[.data[].id] | unique' <<<"$models_json")" '
      type == "object" and
      all(to_entries[];
        (.key | IN("fable", "opus-fast", "astra", "sol", "grok")) and
        (.value | type == "string") and
        (.value as $value | $catalog | index($value))
      )
    ' "$MODEL_ALIASES_FILE" >/dev/null; then
    echo 'Saved model aliases are invalid or retired; deriving replacements from the authenticated catalog.'
    aliases_json='{}'
  else
    aliases_json="$(jq -c . "$MODEL_ALIASES_FILE")"
  fi
else
  aliases_json='{}'
fi
for alias_name in fable opus-fast astra sol grok; do
  jq -e --arg name "$alias_name" 'has($name)' >/dev/null <<<"$aliases_json" && continue
  case "$alias_name" in
    fable) alias_pattern='fable' ;;
    opus-fast) alias_pattern='opus.*fast|fast.*opus' ;;
    astra) alias_pattern='astra' ;;
    sol) alias_pattern='(^|[/_.-])sol([/_.-]|$)' ;;
    grok) alias_pattern='grok' ;;
  esac
  alias_model="$(grep -Ei "$alias_pattern" <<<"$catalog_models" | jq -Rsc 'split("\n") | map(select(length > 0)) | sort_by([scan("[0-9]+|[^0-9]+") | if test("^[0-9]+$") then tonumber else ascii_downcase end]) | last // empty' | jq -r . || true)"
  if [[ -n "$alias_model" ]]; then
    aliases_json="$(jq -c --arg name "$alias_name" --arg model "$alias_model" '. + {($name):$model}' <<<"$aliases_json")"
    echo "Mapped gateway alias '$alias_name' to '$alias_model'."
  else
    echo "Gateway alias '$alias_name' is unavailable in this catalog; skipped."
  fi
done
write_protected() {
  local destination="$1" content="$2" temporary
  temporary="$(mktemp "$CONFIG_DIR/.gateway-write.XXXXXX")"
  printf '%s\n' "$content" >"$temporary"
  chmod 0600 "$temporary"
  mv -f "$temporary" "$destination"
}
write_protected "$ENDPOINT_FILE" "$gateway_url"
if [[ "$MODE" != refresh ]]; then write_protected "$KEY_FILE" "$key"; fi
write_protected "$MODEL_FILE" "$default_model"
write_protected "$MODEL_ALIASES_FILE" "$aliases_json"
write_protected "$PROTOCOL_MODELS_FILE" "$protocol_models_json"
[[ -s "$CODEX_HOME_FILE" ]] || write_protected "$CODEX_HOME_FILE" "$CODEX_HOME"
unset key aliases_json
chmod 0600 "$ENDPOINT_FILE" "$KEY_FILE" "$MODEL_FILE" "$MODEL_ALIASES_FILE" "$PROTOCOL_MODELS_FILE" "$CODEX_HOME_FILE"

[[ -f "$CODEX_TEMPLATE" ]] || { echo 'Missing tracked Codex gateway template.' >&2; exit 1; }
codex_config="$(mktemp "$CODEX_HOME/.gateway-config.XXXXXX")"
sed \
  -e "s|__PRIVATE_AI_GATEWAY_MODEL__|$(jq -Rn --arg value "$responses_model" '$value')|" \
  -e "s|__PRIVATE_AI_GATEWAY_BASE_URL__|${gateway_json%\"}/v1\"|" \
  -e "s|__PRIVATE_AI_GATEWAY_KEY_FILE__|$key_file_json|" \
  "$CODEX_TEMPLATE" >"$codex_config"
chmod 0600 "$codex_config"
mv -f "$codex_config" "$CODEX_HOME/config.toml"

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

opencode_config="$(mktemp "$OPENCODE_HOME/.gateway-config.XXXXXX")"
jq -n \
  --arg base "$gateway_url/v1" \
  --arg key_file "$KEY_FILE" \
  --arg default_model "$chat_model" \
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
  }' >"$opencode_config"
chmod 0600 "$opencode_config"
mv -f "$opencode_config" "$OPENCODE_CONFIG"
chmod 0600 "$CODEX_HOME/config.toml" "$OPENCODE_CONFIG"

write_wrapper() {
  local path="$1" body="$2"
  printf '#!/usr/bin/env bash\nset -euo pipefail\n%s\n' "$body" >"$path"
  chmod 0700 "$path"
}
if [[ -n "$claude_bin" ]]; then
printf -v claude_body '%s\n%s\n%s\n%s' \
  "export ANTHROPIC_BASE_URL='$gateway_url'" \
  "export CLAUDE_CONFIG_DIR='$CLAUDE_HOME'" \
  "export ANTHROPIC_AUTH_TOKEN=\$(<'$KEY_FILE')" \
  "exec '$claude_bin' \"\$@\""
write_wrapper "$BIN_DIR/claude" "$claude_body"
else rm -f "$BIN_DIR/claude"; fi
if [[ -n "$codex_bin" ]]; then
printf -v codex_body '%s\n%s\n%s\n%s' \
  'unset CODEX_ACCESS_TOKEN CODEX_SQLITE_HOME CODEX_ELECTRON_USER_DATA_PATH CODEX_PROFILE_NAME' \
  "export CODEX_HOME=\$(<'$CODEX_HOME_FILE')" \
  'export CODEX_PROFILE_NO_UPDATE_CHECK=1' \
  "exec '$codex_bin' \"\$@\""
write_wrapper "$BIN_DIR/codex" "$codex_body"
else rm -f "$BIN_DIR/codex"; fi
if [[ -n "$opencode_bin" ]]; then
printf -v opencode_body '%s\n%s\n%s' \
  "export OPENCODE_CONFIG='$OPENCODE_CONFIG'" \
  "export OPENCODE_CONFIG_DIR='$OPENCODE_HOME'" \
  "exec '$opencode_bin' \"\$@\""
write_wrapper "$BIN_DIR/opencode" "$opencode_body"
else rm -f "$BIN_DIR/opencode"; fi

# Generic non-secret model router used by shell functions and long-lived tmux servers.
# The single-quoted fragments intentionally expand only when the generated wrapper runs.
# shellcheck disable=SC2016
printf -v gateway_model_body '%s\n%s\n%s\n%s\n%s\n%s\n%s' \
  '[[ $# -ge 2 ]] || { echo "Usage: gateway-model claude|codex|opencode fable|opus-fast|astra|sol|grok [args...]" >&2; exit 2; }' \
  'client="$1"; alias_name="$2"; shift 2' \
  "mapping='$MODEL_ALIASES_FILE'" \
  'case "$client" in claude|codex|opencode) ;; *) echo "Unsupported gateway client: $client" >&2; exit 2;; esac' \
  'model="$(jq -er --arg name "$alias_name" '\''.[$name] // empty'\'' "$mapping" 2>/dev/null)" || { echo "Gateway model alias '\''$alias_name'\'' is unavailable; rerun scripts/setup-private-ai-gateway.sh." >&2; exit 1; }' \
  'export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"' \
  'if [[ "$client" == opencode ]]; then exec "$client" --model "private_gateway/$model" "$@"; else exec "$client" --model "$model" "$@"; fi'
write_wrapper "$BIN_DIR/gateway-model" "$gateway_model_body"

rm -f "$BIN_DIR/claude-direct" "$BIN_DIR/codex-direct" "$BIN_DIR/opencode-direct"

if command -v herdr >/dev/null 2>&1; then
  if [[ -n "$claude_bin" ]]; then
  CLAUDE_CONFIG_DIR="$CLAUDE_HOME" herdr integration install claude >/dev/null
  fi
  if [[ -n "$opencode_bin" ]]; then
  herdr_stage="$(mktemp -d "${TMPDIR:-/tmp}/private-ai-gateway-herdr.XXXXXX")"
  install -d -m 0700 "$herdr_stage/.config/opencode"
  HOME="$herdr_stage" herdr integration install opencode >/dev/null
  cp -R "$herdr_stage/.config/opencode/." "$OPENCODE_HOME/"
  chmod -R go-rwx "$OPENCODE_HOME"
  rm -rf "$herdr_stage"
  herdr_stage=''
  fi
fi

echo "Configured gateway-backed Claude Code, Codex, and OpenCode CLIs for $USER_NAME."
echo "OpenCode catalog: $model_count authenticated gateway models."
echo 'Gateway credentials are prepared. Codex desktop mode is selected separately; terminal Codex uses the isolated gateway home.'
cat <<EOF

Created or refreshed (all outside Git):
  $ENDPOINT_FILE                         mode 0600
  $KEY_FILE                              mode 0600; shared by this user's three CLI wrappers
  $MODEL_FILE                            mode 0600
  $PROTOCOL_MODELS_FILE                  mode 0600
  $MODEL_ALIASES_FILE                    mode 0600
  $CODEX_HOME/config.toml                mode 0600
  $OPENCODE_CONFIG                       mode 0600
  $CODEX_HOME_FILE                       mode 0600
  $BIN_DIR/gateway-model                 mode 0700

Tracked policy links prepared under:
  $CODEX_HOME

Client wrappers are created only when their vendor CLI is installed:
  $BIN_DIR/claude
  $BIN_DIR/codex
  $BIN_DIR/opencode

Next step for Codex desktop mode and automatic model refresh:
  bash scripts/setup-codex-profiles.sh --mode subscription|gateway
  bash scripts/setup-private-ai-gateway.sh --install-refresh
EOF
status
