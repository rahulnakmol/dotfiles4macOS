# Global Variables
export CLICOLOR=1                                                                                                       # Enable colorized output
export GOPATH="$HOME/Developer/go"                                                                                      # Go tooling and package path
export RUSTUP_PATH="/opt/homebrew/opt/rustup"                                                                           # Rustup path
export RUSTUP_HOME="$HOME/Developer/.rustup"                                                                            # Rustup home
export CARGO_HOME="$HOME/Developer/.cargo"                                                                              # Cargo home
export PATH="$HOME/.local/bin:$GOROOT/bin:$GOPATH/bin:$RUSTUP_PATH/bin:$CARGO_HOME/bin:$PATH"                           # Add local bin, rustup & go to PATH
export GCC_COLORS="error=01;31:warning=01;35:note=01;36:caret=01;32:locus=01:quote=01"                                  # Colorize GCC output
export MANPAGER="sh -c 'col -bx | bat -l man -p'"                                                                       # Use bat as manpager
export BAT_THEME="Catppuccin Macchiato"                                                                                 # Set bat theme
export ZSH_HIGHLIGHT_HIGHLIGHTERS_DIR="/opt/homebrew/share/zsh-syntax-highlighting/highlighters"                        # Set zsh-syntax-highlighting highlighters directory
export DOTNET_CLI_TELEMETRY_OPTOUT=1                                                                                    # Disable .NET CLI telemetry
export CGO_ENABLED=1                                                                                                    # Enable CGO for Go for linking C runtime binding
export DISABLE_AUTOUPDATER=1
export SSH_AUTH_SOCK="$HOME/Library/Group Containers/2BUA8C4S2C.com.1password/t/agent.sock"

if [ -d ~/.zshrc.d ]; then
    for rcfile in ~/.zshrc.d/*; do
        if [ -f "$rcfile" ]; then
            source "$rcfile"                                                                                            # Load aliases from a separate file
        fi
    done
fi
unset rcfile

eval "$(starship init zsh)"                                                                                             # Initialize starship prompt
source <(fzf --zsh)                                                                                                     # Set up fzf key bindings and fuzzy completion
test -e "${HOME}/.zshrc.local" && source "${HOME}/.zshrc.local"                                                         # Enable local and secure environment variables

test -e "/opt/homebrew/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh" \
&& source "/opt/homebrew/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh"                                     # Enable syntax highlighting

test -e "/opt/homebrew/share/zsh-autocomplete/zsh-autocomplete.plugin.zsh" \
&& source "/opt/homebrew/share/zsh-autocomplete/zsh-autocomplete.plugin.zsh"                                            # Enable autocomplete

test -e "/opt/homebrew/share/zsh-autosuggestions/zsh-autosuggestions.zsh" \
&& source "/opt/homebrew/share/zsh-autosuggestions/zsh-autosuggestions.zsh"                                             # Enable autosuggestions

test -e "${HOME}/.iterm2_shell_integration.zsh" && source "${HOME}/.iterm2_shell_integration.zsh"
