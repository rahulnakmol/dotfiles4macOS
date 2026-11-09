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

## 2. Choose whether to add focus modes and shortcuts

Core setup is complete without productivity automation. If you want managed app
launching, window layouts and focus timers, choose **one** path:

| Productivity path | Profiles | Main tools | Documentation |
| --- | --- | --- | --- |
| **Raycast script commands** | One shared configuration | Raycast Script Commands, DockFlow, Session | [Raycast module](docs/modules/raycast.md) |

### Raycast Focus & Layouts

Raycast uses shared workflow recipes with Laptop and Desk variants. Install it after the core:

```bash
bash scripts/setup-raycast-native.sh install
```

Native Raycast layouts, Script Commands and Quicklinks coordinate DockFlow and
Session without a custom extension or developer mode. Nine workflows expose
15 workflow variants, 30 display layouts and Workspace/Arrange/Focus actions.
Focus defaults to 45 minutes, with 25/30 available explicitly. Chrome means
Canary only. The [module guide](docs/modules/raycast.md) covers display calibration,
required apps, native import, permissions and checks; [hotkeys](docs/hotkeys.md)
and the [HTML reference](docs/assets/raycast-audit.html) list the aliases and keys.

TF and FDE install role apps and core settings. They do not install Alfred, Karabiner-Elements or Rectangle Pro. See [profile selection](docs/setup-profiles.md).

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
| [`codex`](docs/modules/codex.md) | Switchable subscription/gateway desktop and isolated gateway CLI |
| [`opencode`](docs/modules/opencode.md) | OpenCode configuration and complete gateway model catalog |
| [`cursor`](docs/modules/cursor.md) | Cursor rules and official-account authentication boundary |
| [`raycast`](docs/modules/raycast.md) | Raycast Script Commands for layouts, Dock presets and focus |

Personal credentials, SSH private keys, login state, histories and licenses are
not included. Review [`1password`](docs/modules/1password.md) and
[`ssh`](docs/modules/ssh.md) before applying identity-related configuration.

## Optional private AI gateway

Claude Code, Codex CLI and OpenCode can share one per-user gateway key while
keeping the endpoint and credential outside Git:

```bash
bash scripts/setup-private-ai-gateway.sh         # validates endpoint/key/APIs
bash scripts/setup-codex-profiles.sh             # default: subscription desktop
bash scripts/setup-codex-profiles.sh --mode gateway # switch desktop to gateway
bash scripts/setup-codex-profiles.sh --mode subscription # switch back
bash scripts/setup-codex-profiles.sh --status
herdr integration status
```

Gateway setup automatically Stow-deploys the reviewed Claude and OpenCode modules,
discovers working models without a numbered prompt, and prints every generated
path. Codex setup switches the single desktop `~/.codex` home reversibly between
subscription (reviewed Stow links via `bootstrap-codex`) and gateway (file-backed
gateway config); the inactive home is parked under
`~/.local/state/dotfiles/codex-profiles/`. It installs a missing vendor CLI with
`brew install --cask codex` and refreshes the gateway wrapper. Terminal `codex`
always uses the separate `~/.config/private-ai-gateway/codex` home. Gateway key
setup is separate. `bash scripts/cleanup-codex-profiles.sh --cleanup` is a one-time
legacy reset/archive path, not a mode switch. Previously archived gateway homes
are not auto-restored; review archives under
`~/.local/share/dotfiles/codex-profile-archives/`. Gateway catalog refresh is manual with `--refresh`,
or opt in to daily refresh with `--install-refresh` (undo with `--remove-refresh`).
Cursor stays on the official
Cursor account. See the [Codex module](docs/modules/codex.md),
[OpenCode module](docs/modules/opencode.md), [Claude module](docs/modules/claude.md)
and [Cursor module](docs/modules/cursor.md).

## Documentation

- [Set up the repository](docs/setup.md)
- [Choose TF or FDE role apps](docs/setup-profiles.md)
- [Raycast script commands](docs/modules/raycast.md)
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
