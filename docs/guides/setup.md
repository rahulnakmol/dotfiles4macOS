# Fresh Machine Setup

Choose either this **manual core Stow** path or the profile-aware [FDE](../profiles/fde.md) / [TF](../profiles/tf.md) installer. Both recommend Zen Browser, Claude Desktop, Cursor and ChatGPT/Codex by default.

The manual commands below do not install or Stow Alfred, Karabiner, Rectangle Pro, DockFlow or Session automation. Those remain an optional setup through the profile guides with --productivity.

## 1. Install prerequisites and default apps

Install Apple Command Line Tools with xcode-select --install and Homebrew from https://brew.sh first.

```sh
# Core tools
brew install git node stow zsh tmux neovim eza bat fd ripgrep fzf zoxide starship curl jq gh podman zsh-autosuggestions zsh-syntax-highlighting zsh-autocomplete

# Terminal and configured font
brew install --cask ghostty font-jetbrains-mono-nerd-font

# Default desktop apps and everyday browser
brew install --cask zen claude cursor chatgpt

# Optional end-to-end testing browser
# brew install --cask google-chrome@canary
```

Open Zen once and choose Zen under Default web browser in macOS System Settings. Complete your own app sign-ins directly. Chrome Canary is for end-to-end testing, and Amp is optional from https://ampcode.com/app (its native app requires macOS 26+). Neither is a prerequisite for this baseline. Existing Chrome and Amp installations are left intact.

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

Stow creates symlinks from each module directory into your home folder. Preview the explicit core list, resolve any conflicts by backing up and comparing existing files, then apply:

```sh
stow -n zsh bash bat starship tmux ghostty nvim
stow zsh bash bat starship tmux ghostty nvim
```

These are the same core modules used by the FDE/TF installer. Stow does not install apps. App installation above is independent of stowing Claude/Cursor/Codex settings.

Do not run stow */. Choose extra modules individually after reviewing them for your machine; Git/SSH/signing, credential and agent trust configuration are personal setup decisions. The baseline does not copy those settings or enable productivity automation. Existing personal users can consult the individual module guides for additional configuration.

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
stow zsh bash bat starship tmux ghostty nvim   # re-stow selected core modules
```

Stow is idempotent — re-running it on an already-deployed module is safe.
