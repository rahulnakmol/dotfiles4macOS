# If not running interactively, don't do anything
[[ -z "$PS1" ]] && return

# PATH — build dynamically
PATH="$HOME/.local/bin:$GOPATH/bin:$CARGO_HOME/bin:$PATH"
[[ -d "$HOME/.opencode/bin" ]] && PATH="$HOME/.opencode/bin:$PATH"

# Homebrew — only eval if .bash_profile didn't already set it (non-login shells)
if [[ -z "$HOMEBREW_PREFIX" ]]; then
  if [[ -x /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  elif [[ -x /home/linuxbrew/.linuxbrew/bin/brew ]]; then
    eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"
  fi
fi

# Rustup — resolve from brew or system
if [[ -n "$HOMEBREW_PREFIX" && -d "$HOMEBREW_PREFIX/opt/rustup/bin" ]]; then
  PATH="$HOMEBREW_PREFIX/opt/rustup/bin:$PATH"
elif [[ -d "$HOME/.rustup/toolchains/stable-aarch64-apple-darwin/bin" ]]; then
  PATH="$HOME/.rustup/toolchains/stable-aarch64-apple-darwin/bin:$PATH"
fi

# Source modular configs (00-platform.sh loads first due to sort order)
shopt -s nullglob
for rcfile in "$HOME"/.bashrc.d/*.{sh,bash}; do
  source "$rcfile"
done
unset rcfile
shopt -u nullglob

# Shell integrations
eval "$(starship init bash)"
eval "$(zoxide init --cmd cd bash)"

# fzf — cache generated config for faster startup
_fzf_cache="$HOME/.cache/fzf-bash.bash"
if [[ ! -f "$_fzf_cache" || "$(command -v fzf)" -nt "$_fzf_cache" ]]; then
  mkdir -p "$HOME/.cache"
  fzf --bash > "$_fzf_cache" 2>/dev/null
fi
[[ -f "$_fzf_cache" ]] && source "$_fzf_cache"
unset _fzf_cache

# Local overrides (machine-specific, not committed)
[[ -f "$HOME/.bashrc.local" ]] && source "$HOME/.bashrc.local"
