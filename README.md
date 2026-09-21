# Opinionated dotfiles for macOS

A practical starting point for a new or existing Mac. The repository keeps
reusable configuration for Zsh, Bash, Git, GitHub CLI, tmux, Herdr, Neovim,
Ghostty, Starship, Bat and optional AI coding clients under version control.

Configuration is deployed with [GNU Stow](https://www.gnu.org/software/stow/),
uses Homebrew for packages and applies Catppuccin Macchiato where supported.
It is intentionally opinionated, but each module can be reviewed and installed
independently.

## 1. Install the core dotfiles

This is the foundation. It does not require Alfred, Karabiner, Rectangle Pro or
Raycast.

### Prerequisites

Install Apple Command Line Tools and [Homebrew](https://brew.sh), then install the
core tools:

```bash
xcode-select --install
brew install git gh stow zsh tmux herdr neovim eza bat fd ripgrep fzf zoxide starship curl jq
brew install --cask ghostty font-jetbrains-mono-nerd-font

# Optional AI desktop clients and browser used by the managed workflows
brew install --cask zen claude cursor chatgpt

# Optional browser for end-to-end testing
# brew install --cask google-chrome@canary
```

Amp is optional and is not required for the core dotfiles.

### Clone and deploy

Clone your fork or this repository into a stable location:

```bash
git clone https://github.com/rahulnakmol/dotfiles4macOS.git ~/.dotfiles
cd ~/.dotfiles

# Preview first
stow -n zsh bash bat starship tmux herdr ghostty nvim

# Deploy the selected core modules
stow zsh bash bat starship tmux herdr ghostty nvim
```

Do not run `stow */` and do not use `stow --adopt` blindly. Existing files may
contain personal settings; back them up, compare them and choose modules
deliberately. See the complete [macOS setup guide](docs/setup.md) for shell setup,
post-install checks, local overrides and updates.

Git and GitHub CLI configuration are available but identity-sensitive. Review
the configured name, signing key and 1Password assumptions before running:

```bash
stow git gh
gh auth login
```

## 2. Choose whether to add focus modes and Hyper shortcuts

Core setup is complete without productivity automation. If you want managed app
launching, window layouts, focus timers and a Hyper-key map, choose **one** path:

| Productivity path | Profiles | Main tools | Documentation |
| --- | --- | --- | --- |
| **Raycast Focus & Layouts** | One shared productivity configuration | Raycast Pro, DockFlow, Session | [Raycast module](docs/modules/raycast.md) |
| **Alfred + Karabiner + Rectangle Pro** | **TF — Tech Founder** or **FDE — Full developer environment** | Alfred Powerpack, Karabiner-Elements, Rectangle Pro, DockFlow, Session | [Alfred stack](docs/modules/alfred.md) |

Do not enable both global shortcut maps unchanged. They overlap on launcher,
Hyper, window and focus keys.

### Raycast Focus & Layouts

Raycast has one shared set of modes for every user. Install it after the core:

```bash
bash scripts/setup-raycast-workstation.sh install
```

The extension keeps the internal name `Workmode` for compatibility, but the
user-facing setup is called **Raycast Focus & Layouts**. Its module documents the
required software, eight layouts, seven focus modes, aliases, window commands,
shortcuts, desktop assignments and troubleshooting.

### Alfred + Karabiner + Rectangle Pro

This path offers two productivity profiles:

| Profile | Best fit |
| --- | --- |
| **TF — Tech Founder** | A smaller setup centred on Cursor, Codex and rapid product work. |
| **FDE — Full developer environment** | A wider coding-tool and workflow selection, including T3 Code. |

Choose a profile and install its optional productivity configuration:

```bash
# Replace tf with fde for the full developer environment
bash scripts/setup-workstation.sh plan --profile tf --productivity
bash scripts/setup-workstation.sh apply --profile tf --productivity
bash scripts/setup-workstation.sh check --profile tf --productivity
```

See [profile selection](docs/setup-profiles.md) and the
[Alfred stack module](docs/modules/alfred.md) for prerequisites, permissions,
layouts, focus sessions and rollback.

## Modules

Each top-level Stow module owns one tool's reusable configuration. Module
documentation contains that tool's setup, behavior, keybindings and maintenance
notes instead of splitting those concerns across several guides.

| Module | Purpose |
| --- | --- |
| [`zsh`](docs/modules/zsh.md), [`bash`](docs/modules/bash.md) | Shell startup, aliases and local overrides |
| [`git`](docs/modules/git.md), [`gh`](docs/modules/gh.md) | Git and GitHub CLI configuration |
| [`tmux`](docs/modules/tmux.md) | Prefix, panes, persistence, plugins and AI key tables |
| [`herdr`](docs/modules/herdr.md) | Persistent agent-aware workspaces and integrations |
| [`nvim`](docs/modules/nvim.md) | Neovim/LazyVim configuration |
| [`ghostty`](docs/modules/ghostty.md), [`starship`](docs/modules/starship.md), [`bat`](docs/modules/bat.md) | Terminal, prompt and output presentation |
| [`claude`](docs/modules/claude.md) | Claude Code configuration and gateway route |
| [`codex`](docs/modules/codex.md) | Codex CLI, subscription desktop and gateway desktop profiles |
| [`opencode`](docs/modules/opencode.md) | OpenCode configuration and complete gateway model catalog |
| [`cursor`](docs/modules/cursor.md) | Cursor rules and official-account authentication boundary |
| [`raycast`](docs/modules/raycast.md) | Shared Raycast Focus & Layouts configuration |
| [`alfred`](docs/modules/alfred.md) | Alfred, Karabiner and Rectangle Pro productivity stack |

Personal credentials, SSH private keys, login state, histories and licenses are
not included. Review [`1password`](docs/modules/1password.md) and
[`ssh`](docs/modules/ssh.md) before applying identity-related configuration.

## Optional private AI gateway

Claude Code, Codex CLI and OpenCode can share one per-user gateway key while
keeping the endpoint and credential outside Git:

```bash
bash scripts/setup-private-ai-gateway.sh         # validates endpoint/key/APIs
bash scripts/setup-codex-profiles.sh --mode both # or gateway / subscription
bash scripts/setup-codex-profiles.sh --status
herdr integration status
```

Gateway setup automatically Stow-deploys the reviewed Claude and OpenCode modules,
discovers working models without a numbered prompt, and prints every generated
path. Codex desktop profile selection is separate and owns the Codex Stow
migration. A single mode uses only `~/.codex`; `both` adds
`~/.codex-aigateway`. Terminal `codex` always uses the gateway; a per-user lock
prevents profile-home transitions from racing. Cursor stays on the official
Cursor account. See the [Codex module](docs/modules/codex.md),
[OpenCode module](docs/modules/opencode.md), [Claude module](docs/modules/claude.md)
and [Cursor module](docs/modules/cursor.md).

## Documentation

- [Set up the repository](docs/setup.md)
- [Choose TF or FDE for the Alfred stack](docs/setup-profiles.md)
- [Raycast Focus & Layouts](docs/modules/raycast.md)
- [Alfred + Karabiner + Rectangle Pro](docs/modules/alfred.md)
- [Hotkeys](docs/hotkeys.md) — Raycast-first global map plus tmux and Herdr entry points
- [Module documentation](docs/modules/)
- [Architecture decisions](docs/adr/)

## Validation

```bash
zsh -n zsh/.zshrc
node scripts/validate-agent-policy.mjs
node --test scripts/test-documentation.mjs
tmux -f tmux/.config/tmux/tmux.conf -L audit new-session -d
```

Additional module-specific checks run in CI.

## License

Apache-2.0
