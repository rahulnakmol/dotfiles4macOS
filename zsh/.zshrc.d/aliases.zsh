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
alias ...='cd ...'
alias prj='cd $HOME/Developer/Projects'
alias dotfiles='cd $HOME/.dotfiles'

# Aliases for ls
alias ls='eza -l --color=auto'
alias l='ls -CF --color=auto'
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
alias gcl='git clone'
alias gb!='git blame'
alias glog='git log --oneline --decorate --all --graph'
alias gdiff='git diff'
alias gdiffs='git diff --staged'

# Aliases for tmux
alias t='tmux'
alias ta='tmux attach -t'
alias tl='tmux ls'
alias tk='tmux kill-session -t'
alias tn='tmux new -s'
alias ts='tmux switch -t'
alias tks='tmux kill-session -a'

# Aliases for nvim
alias v='nvim'
alias vi='nvim'
alias vim='nvim'

# Aliases for bat
alias cat='bat'
alias catt='bat --theme="Catppuccin Macchiato" --style="header,grid,numbers'

# Alias to source the zshrc file
alias src='source $HOME/.zshrc'

# Aliases for fzf
alias fzp="fzf --preview 'bat --color=always --style=numbers --line-range=:500 {}' --preview-window=right:70%"
