# .zprofile — runs once on login shell only
# Interactive shell setup (prompt, aliases, plugins) belongs in .zshrc

# Environment variables (set once per session)
export CLICOLOR=1
export GOPATH="$HOME/Developer/tools/go"
export RUSTUP_HOME="$HOME/Developer/tools/rustup"
export CARGO_HOME="$HOME/Developer/tools/cargo"
export GCC_COLORS="error=01;31:warning=01;35:note=01;36:caret=01;32:locus=01:quote=01"
export MANPAGER="sh -c 'col -bx | bat -l man -p'"
export BAT_THEME="Catppuccin Macchiato"
export DOTNET_CLI_TELEMETRY_OPTOUT=1
export DOTNET_ROOT="/opt/homebrew/opt/dotnet/libexec"
export DOTNET_TOOLS="$HOME/Developer/tools/dotnet"
export CGO_ENABLED=1
export DISABLE_AUTOUPDATER=1
export AZURE_DEV_COLLECT_TELEMETRY="no"

# Homebrew (sets PATH, MANPATH, INFOPATH for the login session)
eval "$(/opt/homebrew/bin/brew shellenv)"
