# Shell Hooks
eval "$(/opt/homebrew/bin/brew shellenv)"                                                                   # Initialize Homebrew
eval "$(starship init zsh)"                                                                                 # Initialize Starship prompt
eval "$(zoxide init --cmd cd zsh)"                                                                          # Initialize zoxide
