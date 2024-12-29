# Global Variables
export CLICOLOR=1                                                                                                       # Enable colorized output
export GOPATH="$HOME/Developer/go"
export RUSTUP_PATH="/opt/homebrew/opt/rustup"                                                                           # Rustup path
export RUSTUP_HOME="$HOME/Developer/.rustup"                                                                            # Rustup home
export CARGO_HOME="$HOME/Developer/.cargo"                                                                              # Cargo home
export PATH="$PATH:$GOROOT/bin:$GOPATH/bin:$RUSTUP_PATH/bin"                                                            # Add Rustup & Go to PATH
export GCC_COLORS="error=01;31:warning=01;35:note=01;36:caret=01;32:locus=01:quote=01"                                  # Colorize GCC output
export MANPAGER="sh -c 'col -bx | bat -l man -p'"                                                                       # Use bat as manpager
export BAT_THEME="Catppuccin Macchiatto"                                                                                # Set bat theme
export MAMBA_EXE="/opt/homebrew/opt/micromamba/bin/mamba";                                                              # Set mamba executable
export MAMBA_ROOT_PREFIX="/Users/rahulnakmol/Developer/.mamba";                                                         # Set mamba root prefix
export ZSH_HIGHLIGHT_HIGHLIGHTERS_DIR=/opt/homebrew/share/zsh-syntax-highlighting/highlighters                          # Set zsh-syntax-highlighting highlighters directory
export DOTNET_CLI_TELEMETRY_OPTOUT=1                                                                                    # Disable .NET CLI telemetry
export SSH_AUTH_SOCK="$HOME/Library/Group Containers/2BUA8C4S2C.com.1password/t/agent.sock"

if [ -f ~/.zsh_aliases ]; then
    . ~/.zsh_aliases                                                                                                    # Load aliases from a separate eile
fi

eval "$(starship init zsh)"                                                                                             # Initialize Starship prompt
source <(fzf --zsh)                                                                                                     # Set up fzf key bindings and fuzzy completion
test -e "/opt/homebrew/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh" \
&& source "/opt/homebrew/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh"                                     # Enable syntax highlighting

test -e "${HOME}/.iterm2_shell_integration.zsh" \
&& source "${HOME}/.iterm2_shell_integration.zsh"                                                                       # iTerm2 shell integration

# >>> mamba initialize >>>
# !! Contents within this block are managed by 'mamba shell init' !!
__mamba_setup="$("$MAMBA_EXE" shell hook --shell zsh --root-prefix "$MAMBA_ROOT_PREFIX" 2> /dev/null)"
if [ $? -eq 0 ]; then
    eval "$__mamba_setup"
else
    alias mamba="$MAMBA_EXE"  # Fallback on help from mamba activate
fi
unset __mamba_setup
# <<< mamba initialize <<<
