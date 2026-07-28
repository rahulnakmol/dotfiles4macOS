# PATH — build dynamically, deduplicate
typeset -U PATH
PATH="$HOME/.local/bin:$GOPATH/bin:$CARGO_HOME/bin:$DOTNET_TOOLS:$PATH"
[[ -d "$HOME/.opencode/bin" ]] && PATH="$HOME/.opencode/bin:$PATH"

# Homebrew — only eval if .zprofile didn't already set it (non-login shells)
if [[ -z "$HOMEBREW_PREFIX" && -x /opt/homebrew/bin/brew ]]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
fi

# Rustup — resolve from brew or system
if [[ -n "$HOMEBREW_PREFIX" && -d "$HOMEBREW_PREFIX/opt/rustup/bin" ]]; then
  PATH="$HOMEBREW_PREFIX/opt/rustup/bin:$PATH"
fi

# Source modular configs (00-platform.zsh loads first due to sort order)
for rcfile in "$HOME"/.zshrc.d/*.{zsh,sh}(N.); do
  source "$rcfile"
done
unset rcfile

# Shell integrations
eval "$(starship init zsh)"
eval "$(zoxide init --cmd cd zsh)"

# fzf — cache generated config for faster startup
_fzf_cache="$HOME/.cache/fzf-zsh.zsh"
if [[ ! -f "$_fzf_cache" || "$(command -v fzf)" -nt "$_fzf_cache" ]]; then
  mkdir -p "$HOME/.cache"
  fzf --zsh > "$_fzf_cache" 2>/dev/null
fi
[[ -f "$_fzf_cache" ]] && source "$_fzf_cache"
unset _fzf_cache

# Local overrides (machine-specific, not committed)
[[ -f "$HOME/.zshrc.local" ]] && source "$HOME/.zshrc.local"

# ZSH plugins — check brew prefix first, then system paths
() {
  local dirs=("${HOMEBREW_PREFIX:-/nonexistent}/share" "/usr/share")
  local plugins=(
    "zsh-syntax-highlighting/zsh-syntax-highlighting.zsh"
    "zsh-autocomplete/zsh-autocomplete.plugin.zsh"
    "zsh-autosuggestions/zsh-autosuggestions.zsh"
  )
  local plugin dir
  for plugin in "${plugins[@]}"; do
    for dir in "${dirs[@]}"; do
      [[ -f "$dir/$plugin" ]] && source "$dir/$plugin" && break
    done
  done
}

test -e "${HOME}/.iterm2_shell_integration.zsh" && source "${HOME}/.iterm2_shell_integration.zsh"

