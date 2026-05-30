# macOS-only dotfiles — platform is always macOS
export DOTFILES_PLATFORM="macos"

# Homebrew prefix
if command -v brew &>/dev/null; then
  export DOTFILES_BREW_PREFIX="$(brew --prefix)"
fi
