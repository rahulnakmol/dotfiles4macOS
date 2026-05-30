# .bash_profile — runs once on login shell only
# Interactive shell setup (prompt, aliases) belongs in .bashrc

# Source .bashrc if it exists (login shells don't source .bashrc by default)
[[ -f "$HOME/.bashrc" ]] && source "$HOME/.bashrc"

# Environment variables (set once per session)
export CLICOLOR=1
export GOPATH="$HOME/Developer/go"
export RUSTUP_HOME="$HOME/Developer/.rustup"
export CARGO_HOME="$HOME/Developer/.cargo"
export GCC_COLORS="error=01;31:warning=01;35:note=01;36:caret=01;32:locus=01:quote=01"
export MANPAGER="sh -c 'col -bx | bat -l man -p'"
export BAT_THEME="Catppuccin Macchiato"
export DOTNET_CLI_TELEMETRY_OPTOUT=1
export CGO_ENABLED=1
export DISABLE_AUTOUPDATER=1
export AZURE_DEV_COLLECT_TELEMETRY="no"

# Homebrew (sets PATH, MANPATH, INFOPATH for the login session)
eval "$(/opt/homebrew/bin/brew shellenv)"
