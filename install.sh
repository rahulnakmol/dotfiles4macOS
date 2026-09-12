#!/bin/bash
# Fresh-Mac entry point. Rechecks prerequisites on every run; never resets a checkout.
set -euo pipefail
profile=''
productivity=0
preview=0
open_docs=1
checkout="${DOTFILES_BOOTSTRAP_DIR:-$HOME/.dotfiles}"
usage() {
  echo 'Usage: bash install.sh --profile fde|tf [--productivity] [--directory PATH] [--plan] [--no-open]'
}
while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile|--directory)
      [[ $# -ge 2 && -n "$2" ]] || { usage >&2; exit 1; }
      if [[ "$1" == --profile ]]; then profile="$2"; else checkout="$2"; fi
      shift 2 ;;
    --productivity) productivity=1; shift ;;
    --plan) preview=1; shift ;;
    --no-open) open_docs=0; shift ;;
    --help|-h) usage; exit 0 ;;
    *) usage >&2; exit 1 ;;
  esac
done
case "$profile" in fde|tf) ;; *) usage >&2; exit 1 ;; esac
docs="https://github.com/rahulnakmol/dotfiles4macOS/blob/main/docs/profiles/$profile.md"
if [[ "$preview" == 1 ]]; then
  printf 'Profile: %s\nProductivity: %s (0 = core only)\nCheckout: %s\n' "$profile" "$productivity" "$checkout"
  echo '1. Verify Apple Silicon macOS and Command Line Tools; pause for Apple Installer if missing.'
  echo '2. Install missing Homebrew using its official interactive installer.'
  echo '3. Install missing Git, Node and Stow; clone only if the destination is absent.'
  echo '4. Run the profile plan, apply and check with conflict checks and backups.'
  printf '5. Open manual steps: %s#finish-setup-human-checklist\n' "$docs"
  exit 0
fi
printf "Manual guide: %s#finish-setup-human-checklist\n" "$docs"
[[ "$(uname -s)" == Darwin && "$(uname -m)" == arm64 ]] || { echo 'Use an Apple Silicon Mac and a native terminal (not Rosetta).' >&2; exit 1; }
[[ "$EUID" != 0 ]] || { echo 'Run this as your normal macOS user, not with sudo.' >&2; exit 1; }
state_dir="${DOTFILES_BOOTSTRAP_STATE_DIR:-$HOME/.local/state/dotfiles/onboarding}"
mkdir -p "$state_dir"
state="$state_dir/$profile.log"
record() { printf '%s\t%s\t%s\n' "$(date -u +%FT%TZ)" "$1" "$2" >> "$state"; }
banner() { printf '\nStep %s of 5 — %s\n' "$1" "$2"; }
handoff() {
  printf '\nHuman checklist: %s#finish-setup-human-checklist\n' "$docs"
  printf 'Progress log: %s\nRerun the same command to resume; prerequisites are rechecked.\n' "$state"
  if [[ "$open_docs" == 1 ]]; then open "$docs#finish-setup-human-checklist" || true; fi
}
on_error() { record setup incomplete; echo 'Setup stopped. Existing configuration is not reset; resolve the reported issue and rerun.' >&2; handoff; }
trap on_error ERR

banner 1 'Apple Command Line Tools'
if ! xcode-select -p >/dev/null 2>&1 || ! xcrun --find clang >/dev/null 2>&1; then
  record command-line-tools unverified
  xcode-select --install || true
  echo 'Complete the macOS Command Line Tools installer, then rerun this command.'
  handoff
  exit 2
fi
record command-line-tools verified

banner 2 'Homebrew'
export PATH="$PATH:/opt/homebrew/bin:/opt/homebrew/sbin"
if ! command -v brew >/dev/null 2>&1; then
  brew_installer="$(mktemp -t dotfiles-homebrew)"
  trap 'rm -f "$brew_installer"' EXIT
  curl --fail --silent --show-error --location --proto '=https' --tlsv1.2 \
    https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh --output "$brew_installer"
  # Homebrew owns its password and confirmation prompts; never collect credentials here.
  /bin/bash "$brew_installer"
fi
brew --version >/dev/null
record homebrew verified

banner 3 'Bootstrap tools and dotfiles checkout'
for formula in git node stow; do
  if ! brew list --formula "$formula" >/dev/null 2>&1; then brew install "$formula"; fi
done
git --version >/dev/null
node --version >/dev/null
stow --version >/dev/null
record bootstrap-tools verified
if [[ -L "$checkout" ]]; then echo 'Use a real checkout directory, not a symlink.' >&2; exit 1; fi
if [[ ! -e "$checkout" ]]; then
  git clone https://github.com/rahulnakmol/dotfiles4macOS.git "$checkout"
fi
checkout="$(cd "$checkout" && pwd -P)"
if [[ "$(git -C "$checkout" rev-parse --show-toplevel)" != "$checkout" || ! -f "$checkout/scripts/setup-workstation.sh" ]]; then
  echo 'The destination is not a dotfiles checkout. Choose a nonexistent --directory or the correct existing checkout.' >&2
  exit 1
fi
echo 'Using this checkout as-is; local edits and branch selection are preserved.'
record checkout verified

banner 4 'Profile installation, Stow and validation'
args=(--profile "$profile")
if [[ "$productivity" == 1 ]]; then args+=(--productivity); fi
bash "$checkout/scripts/setup-workstation.sh" plan "${args[@]}"
bash "$checkout/scripts/setup-workstation.sh" apply "${args[@]}"
record profile-apply verified
check_status=0
bash "$checkout/scripts/setup-workstation.sh" check "${args[@]}" || check_status=$?
if [[ "$check_status" == 0 ]]; then record profile-check verified; else record profile-check unverified; fi

banner 5 'Finish the human checklist'
record human-checklist unverified
handoff
if [[ "$check_status" != 0 ]]; then
  echo 'Installation ran, but checks still need attention. Review the report and manual steps, then rerun.'
  exit 2
fi
echo 'Managed setup checks passed. Permissions, app sign-ins, licenses and physical workflow checks are still manual.'
