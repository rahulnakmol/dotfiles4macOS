# Fresh Machine Setup

Step-by-step guide to deploying this dotfiles repo on a new Mac.

---

## 1. Install prerequisites

```bash
# Core tools
brew install git stow zsh tmux neovim eza bat fd ripgrep fzf zoxide starship curl jq gh

# Terminal and fonts
brew install --cask ghostty 1password 1password-cli
brew install --cask font-mononoki-nerd-font

# AI coding tools
brew install claude opencode
```

Configure Ghostty (or your terminal) to use Mononoki Nerd Font.

## 2. Set zsh as default shell

```bash
chsh -s $(which zsh)
```

Log out and back in for the change to take effect.

## 3. Clone the repo

```bash
git clone https://github.com/rahulnakmol/dotfiles4macOS.git ~/.dotfiles
cd ~/.dotfiles
```

## 4. Deploy modules with stow

Stow creates symlinks from each module directory into `$HOME`. Deploy in this order to satisfy dependencies:

```bash
# Step 1: Shell foundation
stow zsh

# Step 2: Core tools
stow git ssh starship bat

# Step 3: Terminal and editor
stow tmux ghostty nvim

# Step 4: Dev tools
stow gh

# Step 5: AI coding tools
stow claude opencode

# Step 6: Credentials (if using 1Password)
stow 1password

# Step 7: Additional editors/terminals (optional)
stow zed iTerm2
```

To preview what stow will do before committing:

```bash
stow -n zsh    # dry-run, shows what symlinks would be created
```

To deploy everything at once:

```bash
stow zsh git ssh starship bat tmux ghostty nvim gh claude opencode 1password zed iTerm2
```

## 5. Post-install steps

### Tmux plugins

TPM (Tmux Plugin Manager) bootstraps automatically on first tmux launch. If plugins are missing:

1. Start tmux: `tmux`
2. Press `C-a I` (capital I) to install plugins
3. Press `C-a r` to reload config

### Neovim plugins

LazyVim will auto-install plugins on first launch:

```bash
nvim
```

Wait for Lazy to finish, then quit and reopen. Run `:checkhealth` to verify everything is working.

### Bat themes

After stowing bat, build the theme cache:

```bash
bat cache --build
```

### 1Password SSH agent

If using 1Password for SSH keys and commit signing:

1. Install 1Password and the 1Password CLI
2. Enable the SSH agent in 1Password settings
3. Deploy the module: `stow 1password`
4. The SSH config and git config reference the 1Password agent socket automatically

### GitHub CLI

```bash
gh auth login
```

### Starship prompt

Starship initializes automatically from `.zshrc`. No extra setup needed after `stow starship`.

## 6. Local overrides

For machine-specific config that should not be committed:

- **Shell**: create `~/.zshrc.local` (sourced at the end of `.zshrc`)
- **Git**: use `~/.gitconfig.local` with `includeIf` directives
- **Secrets**: set `GITHUB_PAT`, `CONTEXT7_API_KEY`, etc. in `~/.zshrc.local`

## 7. Keeping things updated

After pulling changes from the repo:

```bash
cd ~/.dotfiles
git pull
stow zsh tmux git   # re-stow any modules that changed
```

Stow is idempotent — re-running it on an already-deployed module is safe.
