# Enable color support for ls and other utilities
alias ls='ls --color=auto'
alias dir='dir --color=auto'
alias vdir='vdir --color=auto'
alias grep='grep --color=auto'
alias fgrep='fgrep --color=auto'
alias egrep='egrep --color=auto'

# Aliases for zoxide
alias zl='zoxide query -l -s | fzf --preview "bat --color=always --style=numbers --line-range=:500 {}" --preview-window=right:70%'
alias ..='cd ..'
alias ...='cd ../..'
alias prj='cd $HOME/Developer/Projects'
alias ghr='cd $HOME/Developer/Github'
alias dotfiles='cd $HOME/.dotfiles'

# Aliases for ls
alias ls='eza -l --color=auto'
alias l='eza -F --color=auto'
alias ll='ls -alF --color=auto'
alias la='ls -A --color=auto'
alias lar='ls -laRt changed'

# Aliases for homebrew
alias bi='brew install'
alias bu='brew uninstall'
alias bl='brew list'
alias bs='brew search'
alias bc='brew cleanup'
alias bup='brew update'
alias bug='brew upgrade'
alias buu='brew update && brew upgrade && brew cleanup'
alias binf='brew info'

# Aliases for git
alias gs='git status'
alias ga='git add'
alias gc='git commit -m'
alias gp='git push'
alias gpl='git pull'
alias gco='git checkout'
alias gb='git branch -a'
alias gf='git fetch'
alias gcl='gh repo clone'
alias gb!='git blame'
alias glog='git log --oneline --decorate --all --graph'
alias gdiff='git diff'
alias gdiffs='git diff --staged'

# Aliases for GitHub CLI
alias ghl='gh auth login --hostname github.com'
alias ghs='gh auth status --hostname github.com'
alias gsync='gh repo sync'
alias gpc='gh pr create --fill --web'
alias gpv='gh pr view --web'
alias gprs='gh pr list'
alias gpx='gh pr checkout'
alias gic='gh issue create --web'
alias gil='gh issue list'
alias grls='gh release list'

# Aliases for tmux
alias t='tmux'
alias ta='tmux attach -t'
alias tl='tmux ls'
alias tk='tmux kill-session -t'
alias tn='tmux new -s'
alias ts='tmux switch -t'
alias tks='tmux kill-session -a'

# Aliases for npm
alias ni='npm install'
alias nis='npm install --save'
alias nid='npm install --save-dev'
alias nig='npm install -g'
alias nu='npm uninstall'
alias nug='npm uninstall -g'
alias nr='npm run'
alias ns='npm start'
alias nt='npm test'
alias nb='npm run build'
alias nd='npm run dev'
alias nl='npm list --depth=0'
alias nlg='npm list -g --depth=0'
alias nup='npm update'
alias no='npm outdated'
alias nci='npm ci'
alias na='npm audit'
alias naf='npm audit fix'
alias np='npm publish'
alias ninit='npm init -y'
alias nx='npx'

# Node.js helpers
alias node-versions='ls -1 $HOME/.nvm/versions/node 2>/dev/null || echo "NVM not found"'
alias nv='node --version'
alias npmv='npm --version'

# Aliases for nvim
alias v='nvim'
alias vi='nvim'
alias vim='nvim'

# Aliases for bat
alias cat='bat'
alias catt='bat --theme="Catppuccin Macchiato" --style="header,grid,numbers"'

# Alias to source the zshrc file
alias src='source $HOME/.zshrc'
alias cls='clear'

# Aliases for ssh
alias s='ssh'
alias sa='ssh -A'
alias sc='nvim ~/.ssh/config'
alias sk='ls ~/.ssh'
alias sr='ssh-add -D && ssh-add'
# Fuzzy pick host from ~/.ssh/config
ssh_host() {
  local host
  host=$(awk '/^Host /{for(i=2;i<=NF;i++) if ($i != "*") print $i}' "$HOME/.ssh/config" | sort -u | fzf --prompt="SSH host > ")
  [ -n "$host" ] && ssh "$host"
}
alias sh='ssh_host'
# Print public key from a private key (default id_ed25519)
spub() { ssh-keygen -y -f "${1:-$HOME/.ssh/id_ed25519}"; }
alias sp='spub'
# Generate a new ed25519 key quickly
snew() { ssh-keygen -t ed25519 -C "${1:-$(whoami)@$(hostname)}" -f "${2:-$HOME/.ssh/id_ed25519}"; }

# Aliases for docker
alias d='docker'
alias dps='docker ps'
alias dpsa='docker ps -a'
alias di='docker images'
alias drm='docker rm'
alias drmi='docker rmi'
alias drun='docker run'
alias dex='docker exec -it'
alias dlogs='docker logs'
alias dlogsf='docker logs -f'
alias dstop='docker stop'
alias dstart='docker start'
alias drestart='docker restart'
alias dpull='docker pull'
alias dbuild='docker build'
alias dcp='docker cp'
alias dinsp='docker inspect'
alias dvol='docker volume ls'
alias dnet='docker network ls'
alias dprune='docker system prune -af'
alias dc='docker compose'
alias dcu='docker compose up -d'
alias dcd='docker compose down'
alias dcl='docker compose logs -f'
alias dcps='docker compose ps'

# Aliases for claude code
alias cc='claude'                                                                                                        # Interactive session (Sonnet default)
alias ccc='claude -c'                                                                                                    # Continue last conversation
alias ccp='claude -p'                                                                                                    # Non-interactive print mode
alias ccr='claude --resume'                                                                                              # Resume a specific session

# Claude coding workflows (model + permission mode)
alias ccs='claude --model sonnet --permission-mode auto'                                                          # Sonnet — daily coding
alias cco='claude --model opus --permission-mode auto'                                                            # Opus — architecture, complex tasks
alias cch='claude --model haiku'                                                                                         # Haiku — quick answers
alias ccpl='claude --model opus --permission-mode plan'                                                                  # Opus plan — read-only exploration
alias 'cc!'='claude --model sonnet --dangerously-skip-permissions'                                                       # Sonnet autopilot — fast agentic
alias 'cco!'='claude --model opus --dangerously-skip-permissions'                                                        # Opus autopilot — full agentic

# Aliases for opencode (via Zen provider)
alias oc='opencode'                                                                                                      # Launch TUI
alias occ='opencode -c'                                                                                                  # Continue last session
alias ocr='opencode run'                                                                                                 # Headless run (non-interactive)
alias ocrc='opencode run -c'                                                                                             # Continue last session headless
alias ocm='opencode -m'                                                                                                  # Launch with specific model
alias ocw='opencode web'                                                                                                 # Open web interface
alias ocpr='opencode pr'                                                                                                 # Checkout and review a GitHub PR
alias ocsl='opencode session list'                                                                                       # List sessions
alias ocse='opencode export'                                                                                             # Export session as JSON
alias ocsi='opencode import'                                                                                             # Import session from JSON or share URL
alias ocml='opencode models'                                                                                             # List available models
alias ocli='opencode providers login'                                                                                    # Login to provider
alias ocst='opencode stats'                                                                                              # Show usage statistics
alias ocp='opencode --pure'                                                                                              # Launch without plugins
alias ocum='~/.config/opencode/update-models.sh'                                                                         # Update agent models to latest Zen versions
alias ocumd='~/.config/opencode/update-models.sh --dry-run'                                                              # Dry-run model update (show changes only)

# Aliases for Azure CLI (az)
alias azl='az login'
alias azld='az login --use-device-code'
alias azlo='az logout'
alias azs='az account show'
alias azal='az account list -o table'
alias azas='az account set -s'
alias azrgl='az group list -o table'
alias azrgc='az group create -n'
alias azrgd='az group delete -n'
alias azrl='az resource list -o table'
alias azvml='az vm list -o table'
alias azvms='az vm start -n'
alias azvmx='az vm stop -n'
alias azvmd='az vm deallocate -n'
alias azaksl='az aks list -o table'
alias azaksc='az aks get-credentials -n'
alias azacrl='az acr list -o table'
alias azwal='az webapp list -o table'
alias azsal='az storage account list -o table'
alias azup='az upgrade'
alias azv='az version'
alias azwho='az ad signed-in-user show'
alias azfind='az find'

# Aliases for Azure Developer CLI (azd)
alias azdl='azd auth login'
alias azdlo='azd auth logout'
alias azdi='azd init'
alias azdu='azd up'
alias azdd='azd down'
alias azdp='azd provision'
alias azddp='azd deploy'
alias azdm='azd monitor'
alias azde='azd env list'
alias azdes='azd env select'
alias azdt='azd template list'

# Aliases for fzf
alias fzp="fzf --preview 'bat --color=always --style=numbers --line-range=:500 {}' --preview-window=right:70%"
