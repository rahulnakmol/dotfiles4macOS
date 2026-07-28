# Dependencies

Every tool this repo references, grouped by tier with Homebrew install commands.

---

## Tier 1 — Required

These must be installed for core dotfiles functionality.

| Tool | Purpose |
|------|---------|
| `git` | Version control, plugin bootstrapping |
| `stow` | Symlink dotfiles into `$HOME` |
| `zsh` | Shell |
| `tmux` | Terminal multiplexer |
| `neovim` | Editor (0.10+, LazyVim) |
| `eza` | Modern `ls` (aliased as `ls`, `ll`, `la`) |
| `bat` | Syntax-highlighted `cat` |
| `fd` | Fast file finder |
| `ripgrep` | Fast grep (`rg`) |
| `fzf` | Fuzzy finder, shell completion |
| `zoxide` | Smart directory jumper (replaces `cd`) |
| `starship` | Cross-shell prompt |
| `curl` | HTTP requests (scripts, plugin bootstrap) |
| `jq` | JSON processing (statusline, model updater) |

### Install

```bash
brew install git stow zsh tmux neovim eza bat fd ripgrep fzf zoxide starship curl jq
```

---

## Tier 2 — Recommended

Most workflows and aliases depend on these.

| Tool | Purpose | Used by |
|------|---------|---------|
| `gh` | GitHub CLI (PRs, issues, repo sync) | `g*` aliases, `gh` module |
| `ghostty` | GPU-accelerated terminal | `ghostty` module |
| `1password` | SSH agent, commit signing | `git`, `ssh`, `1password` modules |
| `op` | 1Password CLI | Git commit signing (`op-ssh-sign`) |
| `Mononoki Nerd Font` | Glyphs for prompt, editor, tmux | `ghostty`, `starship`, `nvim` |

### Install

```bash
brew install gh
brew install --cask ghostty 1password 1password-cli
brew install --cask font-mononoki-nerd-font
```

---

## Tier 3 — AI Coding Tools

The tmux config and shell aliases integrate heavily with these tools.

| Tool | Purpose | Used by |
|------|---------|---------|
| `claude` | Claude Code (Anthropic) | `cc*` aliases, tmux `C-a c` key table |
| `opencode` | OpenCode (Zen provider) | `oc*` aliases, tmux `C-a o` key table |

### Install

```bash
brew install claude opencode
```

---

## Tier 4 — Optional

Only needed for specific workflows. Aliases exist but won't break anything if the tool is absent.

### Containers

| Tool | Purpose | Used by |
|------|---------|---------|
| `podman` | Container engine (Docker-compatible, rootless) | `d*` aliases, `docker`/`docker-compose` alias |
| `podman-compose` | Compose provider for `podman compose` | `dc*` aliases |

```bash
brew install podman podman-compose
podman machine init
podman machine start
```

`docker` and `docker-compose` are aliased to `podman` and `podman compose` (see `zsh/.zshrc.d/aliases.zsh`), so Docker CLI muscle memory keeps working. Tools that exec the `docker` binary directly (not through the shell) still need Docker Desktop or `podman-mac-helper` + `podman machine` socket compat.

### Cloud

| Tool | Purpose | Used by |
|------|---------|---------|
| `az` | Azure CLI | `az*` aliases |
| `azd` | Azure Developer CLI | `azd*` aliases |

```bash
brew install azure-cli
curl -fsSL https://aka.ms/install-azd.sh | bash
```

### Mac App Store

| Tool | Purpose | Used by |
|------|---------|---------|
| `mas` | Mac App Store CLI (install/update App Store apps) | `m*` aliases |

```bash
brew install mas
```

### Node.js / npm

| Tool | Purpose | Used by |
|------|---------|---------|
| `node` | JavaScript runtime | AI tools, MCP servers |
| `npm` | Package manager | `n*` aliases |

```bash
brew install node
```

### Languages (for Neovim LSP extras)

| Tool | Purpose |
|------|---------|
| `go` | Go language support |
| `rustup` / `cargo` | Rust toolchain |
| `python3` | Python support |
| `dotnet` | C# / .NET support |
| `stylua` | Lua formatter |

```bash
brew install go rustup python3 dotnet stylua
```

---

## Quick reference

One-liner to install all Tier 1 + Tier 2 + Tier 3 tools:

```bash
brew install git stow zsh tmux neovim eza bat fd ripgrep fzf zoxide starship curl jq gh claude opencode
brew install --cask ghostty 1password 1password-cli font-mononoki-nerd-font
```
