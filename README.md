# dotfiles for macOS

Personal macOS configuration managed with [GNU Stow](https://www.gnu.org/software/stow/). Catppuccin Macchiato theme across all tools. Homebrew as primary package manager.

## Modules

| Module | Purpose |
|--------|---------|
| `zsh` | Shell config with 120+ aliases, modular `.zshrc.d/` structure |
| `tmux` | Terminal multiplexer with Claude Code & OpenCode key tables |
| `nvim` | Neovim with LazyVim and Catppuccin colorscheme |
| `ghostty` | GPU-accelerated terminal emulator |
| `starship` | Cross-shell prompt with Catppuccin palette |
| `git` | Version control with SSH commit signing via 1Password |
| `gh` | GitHub CLI with 25+ workflow aliases |
| `ssh` | SSH config with 1Password agent integration |
| `1password` | SSH agent vault configuration |
| `bat` | Syntax-highlighted `cat` with Catppuccin themes |
| `claude` | Claude Code settings, keybindings, statusline |
| `opencode` | OpenCode (Zen provider) config with agent profiles |
| `zed` | Code editor with Catppuccin and AI integration |
| `iTerm2` | Terminal emulator (macOS failsafe) |

## Quick Start

```bash
# Install prerequisites
brew install git stow zsh tmux neovim eza bat fd ripgrep fzf zoxide starship curl jq gh
brew install --cask ghostty 1password 1password-cli font-mononoki-nerd-font

# AI coding tools
brew install claude opencode

# Clone and deploy
git clone https://github.com/rahulnakmol/dotfiles4macOS.git ~/.dotfiles
cd ~/.dotfiles

# Deploy modules (order matters for dependencies)
stow zsh git ssh starship bat          # Shell foundation
stow tmux ghostty nvim                 # Terminal and editor
stow gh 1password                      # Dev tools
stow claude opencode                   # AI coding tools
stow zed iTerm2                        # Additional editors/terminals
```

## Dependencies

### Tier 1 — Required
```bash
brew install git stow zsh tmux neovim eza bat fd ripgrep fzf zoxide starship curl jq
```

### Tier 2 — Recommended
```bash
brew install gh
brew install --cask ghostty 1password 1password-cli
brew install --cask font-mononoki-nerd-font
```

### Tier 3 — AI Coding Tools
```bash
brew install claude opencode
```

### Tier 4 — Optional
```bash
brew install --cask docker             # Docker Desktop
brew install node go rustup dotnet     # Language runtimes
brew install stylua                    # Lua formatter
brew install azure-cli                 # Azure CLI
brew install mas                       # Mac App Store CLI
```

## Post-Install

### Tmux plugins
TPM bootstraps automatically. If plugins are missing: start tmux, press `C-a I`, then `C-a r`.

### Neovim plugins
LazyVim auto-installs on first launch. Run `:checkhealth` to verify.

### 1Password SSH agent
Enable the SSH agent in 1Password settings. The SSH and git configs reference the agent socket automatically.

### Local overrides
Machine-specific config goes in `~/.zshrc.local` (sourced automatically, not committed).

## Documentation

- `docs/guides/setup.md` — Fresh machine setup guide
- `docs/guides/dependencies.md` — Full dependency list with install commands
- `docs/guides/aliases.md` — Complete alias reference (120+ aliases)
- `docs/guides/tmux-keybindings.md` — Tmux key table reference including AI tools
- `docs/modules/` — Per-module documentation

## License

Apache-2.0
