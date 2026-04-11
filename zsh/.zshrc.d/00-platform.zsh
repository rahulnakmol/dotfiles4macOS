# Detect platform and set environment for conditional loading
# Exports: DOTFILES_PLATFORM (macos|linux|unknown)
#          DOTFILES_BREW_PREFIX (set only when Homebrew is present)

case "$(uname -s)" in
  Darwin) export DOTFILES_PLATFORM="macos" ;;
  Linux)  export DOTFILES_PLATFORM="linux" ;;
  *)      export DOTFILES_PLATFORM="unknown" ;;
esac

# Homebrew prefix
if command -v brew &>/dev/null; then
  export DOTFILES_BREW_PREFIX="$(brew --prefix)"
fi
