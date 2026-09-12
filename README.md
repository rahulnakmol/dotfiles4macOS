# dotfiles for macOS

Personal macOS configuration managed with [GNU Stow](https://www.gnu.org/software/stow/). Catppuccin Macchiato theme across all tools. Homebrew as primary package manager.

## Start with one command or a double-click launcher

See [Start here](docs/setup.md) for fresh-Mac setup, the four FDE/TF launchers, resumable installation and the GitHub human checklists. From a checkout: `bash install.sh --profile fde` or `bash install.sh --profile tf`. Add `--productivity` only when wanted.

## Choose your setup: FDE or TF

Both profiles install **Zen Browser, Claude Desktop, Cursor and ChatGPT/Codex** by default. Set Zen as the macOS default browser during setup. FDE code sessions use three desktops: Zen maximized, Amp/Claude/Cursor/T3 Code maximized, and Ghostty ⅔ + Slack ⅓. FDE installs T3 Code; TF retains Codex for Innovate. Work keeps Edge. **Google Chrome Canary** is optional for end-to-end testing: `brew install --cask google-chrome@canary`. Stable Chrome and Amp are not installation requirements.

New machines should start with the [FDE manual](docs/profiles/fde.md) or
[TF (Tech Founder) manual](docs/profiles/tf.md). Browser guides:
[FDE](docs/profiles/fde.html) · [TF](docs/profiles/tf.html).

```sh
bash scripts/setup-workstation.sh plan --profile tf
bash scripts/setup-workstation.sh apply --profile tf
bash scripts/setup-workstation.sh check --profile tf
```

Use `fde` for the full setup; `tf` provides Claude Desktop, Cursor, Codex and Zen Browser, with five DockFlow
presets when productivity is enabled. Both include the shared CLI toolkit and role apps. Selection
is local to each Mac. Karabiner uses its official DMG/PKG installer, not Homebrew.
Amp is optional; FDE retains its workflow for users who install it. FDE Hyper+G opens T3 Code and Hyper+T opens optional Telegram (shortcut only). TF uses Code + Cursor and Innovate + Codex. Productivity is **opt-in**: default
setup does not install or Stow Alfred, Karabiner, Rectangle Pro, DockFlow,
CleanShot or Session management. Add `--productivity` to each `plan`, `apply`
and `check` command to include them. Without that flag, existing productivity
settings remain untouched, even when changing FDE/TF profiles.

```sh
bash scripts/setup-workstation.sh plan --profile tf --productivity
bash scripts/setup-workstation.sh apply --profile tf --productivity
bash scripts/setup-workstation.sh check --profile tf --productivity
```

Your existing setup is retained until you explicitly apply a profile. Personal
Git/SSH/signing, credentials, agent trust settings and licenses are never copied
to a colleague by this installer.

[Hotkeys manual](docs/hotkeys.md) · [Standalone visual guide](docs/hotkeys.html) — Hyper, Meh, focus sessions, layouts and fresh-Mac setup.

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
| `bash` | Bash shell config with modular .bashrc.d structure |
| `claude` | Claude Code settings, keybindings, statusline |
| `codex` | macOS Codex preferences, shared engineering guidance, and permission policy |
| `opencode` | OpenCode (Zen provider) config with agent profiles |
| `cursor` | Cursor AI editor with global enterprise architecture rules |
| `alfred` | Google Workspace and DockFlow workflows; broader migration in progress |
| `karabiner` | Hyperland profile for keyboard-first apps, desktops and windows |
| `rectangle-pro` | Importable thirds/two-thirds shortcuts and login settings |

## Quick Start — manual Stow, core setup

Use this path to choose modules yourself without Alfred, Karabiner, Rectangle Pro or session automation. Both profiles recommend the same default desktop apps for this path.

```sh
# Shared CLI tools and terminal
brew install git node stow zsh tmux neovim eza bat fd ripgrep fzf zoxide starship curl jq gh podman zsh-autosuggestions zsh-syntax-highlighting zsh-autocomplete
brew install --cask ghostty font-jetbrains-mono-nerd-font

# Default desktop apps and browser
brew install --cask zen claude cursor chatgpt

# Clone your dotfiles repository, then preview and deploy only core modules
git clone https://github.com/rahulnakmol/dotfiles4macOS.git ~/.dotfiles
cd ~/.dotfiles
stow -n zsh bash bat starship tmux ghostty nvim
stow zsh bash bat starship tmux ghostty nvim

# Optional browser for end-to-end testing
# brew install --cask google-chrome@canary
```

Open Zen and set it as Default web browser in macOS System Settings. Sign in to your own Claude, Cursor and ChatGPT/Codex accounts directly. Installing these apps does not require stowing their configuration modules. Amp is optional; download its native app from https://ampcode.com/app if needed.

Add other modules individually after reviewing them for your own machine. Personal Git/SSH/signing, credentials and agent trust settings are separate from this baseline. Avoid `stow */`; use the explicit module list above. See the [manual setup guide](docs/guides/setup.md) for conflicts, validation and updates.

## Dependencies

### Tier 1 — Required
```bash
brew install git stow zsh tmux neovim eza bat fd ripgrep fzf zoxide starship curl jq
```

### Tier 2 — Recommended
```bash
brew install gh
brew install --cask ghostty font-jetbrains-mono-nerd-font
```

### Tier 3 — AI Coding Tools
```bash
brew install --cask zen claude cursor chatgpt
# Optional: brew install --cask google-chrome@canary
```

### Tier 4 — Optional
```bash
brew install podman podman-compose     # Podman (Docker-compatible engine)
brew install node go rustup dotnet     # Language runtimes
brew install stylua                    # Lua formatter
brew install azure-cli                 # Azure CLI
brew install mas                       # Mac App Store CLI
brew install --cask alfred rectangle-pro # Launcher and window shortcuts
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
- `docs/guides/opencode-sdlc.md` — OpenCode SDLC agent, command, workflow, and handoff guide
- `docs/modules/` — Per-module documentation
- [Codex setup, updates, parity, and rollback](docs/modules/codex.md)
- [Raycast settings checklist and private migration](docs/modules/raycast.md) — not a Stow module
- [Alfred migration and installed-plugin parity](docs/modules/alfred.md)
- [Hyper keyboard navigation and Work/Code/Zen layouts](docs/modules/hyper.md)
- [Fresh-Mac Hyper/Meh bootstrap, CleanShot capture, checks and rollback](docs/modules/hyper-bootstrap.md)

## License

Apache-2.0
