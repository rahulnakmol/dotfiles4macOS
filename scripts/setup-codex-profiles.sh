#!/usr/bin/env bash
# Install the pinned codex-profile launcher and configure subscription/gateway desktop routes.
set -euo pipefail

ROOT="${DOTFILES_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd -P)}"
MODE=both
ACTION=install
PREFIX="${CODEX_PROFILE_PREFIX:-$HOME/.local}"
BIN_DIR="$PREFIX/bin"
PROFILE_BIN="$BIN_DIR/codex-profile"
VERSION=1.2.0
COMMIT=d2260b800297a2b6441b3341c5c3ac48b67d59a1
SHA256="${CODEX_PROFILE_SHA256:-8b32679d8be7d44eaf424c9f1fdf971817226c35b155c33c0082f98243825a2a}"
DOWNLOAD_URL="${CODEX_PROFILE_DOWNLOAD_URL:-https://raw.githubusercontent.com/Ducksss/codex-profiles/$COMMIT/bin/codex-profile}"

usage() {
  echo 'Usage: scripts/setup-codex-profiles.sh [--mode subscription|gateway|both] [--status|--uninstall]'
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode) [[ $# -ge 2 ]] || { usage >&2; exit 2; }; MODE="$2"; shift 2 ;;
    --status) ACTION=status; shift ;;
    --uninstall) ACTION=uninstall; shift ;;
    -h|--help) usage; exit 0 ;;
    *) usage >&2; exit 2 ;;
  esac
done
case "$MODE" in subscription|gateway|both) ;; *) usage >&2; exit 2 ;; esac

write_launcher() {
  local destination="$1" profile="$2"
  cat >"$destination" <<EOF
#!/usr/bin/env bash
set -euo pipefail
unset CODEX_HOME CODEX_ACCESS_TOKEN CODEX_SQLITE_HOME CODEX_ELECTRON_USER_DATA_PATH CODEX_PROFILE_NAME
export CODEX_PROFILE_NO_UPDATE_CHECK=1
export PATH="\$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:\$PATH"
exec codex-profile app $profile "\$@"
EOF
  chmod 0700 "$destination"
}

status() {
  local failed=0 item
  if [[ -x "$PROFILE_BIN" ]] && [[ "$($PROFILE_BIN version 2>/dev/null)" == *"$VERSION"* ]]; then
    echo "codex-profile      pinned v$VERSION"
  else
    echo "codex-profile      absent or not pinned v$VERSION"
    failed=1
  fi
  for item in chatgpt-subscription chatgpt-aigateway; do
    if [[ -x "$BIN_DIR/$item" ]]; then
      printf '%-20s configured\n' "$item"
    elif [[ "$MODE" == both || "$MODE" == subscription && "$item" == chatgpt-subscription || "$MODE" == gateway && "$item" == chatgpt-aigateway ]]; then
      printf '%-20s absent\n' "$item"
      failed=1
    else
      printf '%-20s not selected\n' "$item"
    fi
  done
  if [[ "$MODE" == gateway || "$MODE" == both ]]; then
    bash "$ROOT/scripts/setup-private-ai-gateway.sh" --status || failed=1
  fi
  return "$failed"
}

if [[ "$ACTION" == status ]]; then status; exit; fi
[[ "$(uname -s)" == Darwin ]] || { echo 'Codex desktop profile setup supports macOS only.' >&2; exit 1; }
[[ "${EUID:-$(id -u)}" != 0 ]] || { echo 'Run as the signed-in macOS user, not with sudo.' >&2; exit 1; }

if [[ "$ACTION" == uninstall ]]; then
  rm -f "$BIN_DIR/chatgpt-subscription" "$BIN_DIR/chatgpt-aigateway"
  echo 'Removed profile launchers. Profile homes and codex-profile were retained for safe rollback.'
  exit 0
fi

install -d -m 0700 "$BIN_DIR"
temporary="$(mktemp "${TMPDIR:-/tmp}/codex-profile.XXXXXX")"
trap 'rm -f "$temporary"' EXIT
curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 "$DOWNLOAD_URL" --output "$temporary"
actual="$(shasum -a 256 "$temporary" | awk '{print $1}')"
[[ "$actual" == "$SHA256" ]] || { echo 'codex-profile checksum mismatch; nothing installed.' >&2; exit 1; }
install -m 0755 "$temporary" "$PROFILE_BIN"
ln -sfn codex-profile "$BIN_DIR/codex-profiles"
"$PROFILE_BIN" version >/dev/null

case "$MODE" in
  subscription|both)
    bash "$ROOT/scripts/bootstrap-codex.sh" apply
    if command -v herdr >/dev/null 2>&1; then
      CODEX_HOME="$HOME/.codex" herdr integration install codex >/dev/null
    fi
    write_launcher "$BIN_DIR/chatgpt-subscription" default
    ;;
esac
case "$MODE" in
  gateway|both)
    bash "$ROOT/scripts/setup-private-ai-gateway.sh"
    write_launcher "$BIN_DIR/chatgpt-aigateway" aigateway
    ;;
esac

echo "Configured Codex desktop mode: $MODE"
echo 'Terminal codex is gateway-only whenever gateway mode is configured.'
status
