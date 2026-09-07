# Dotfiles — GNU Stow

Each top-level folder is a stow module that symlinks into `$HOME`. Deploy: `stow <module>`. Dry-run: `stow -n <module>`.

## Modules
`1password` `bash` `bat` `claude` `codex` `cursor` `gh` `ghostty` `git` `nvim` `opencode` `ssh` `starship` `tmux` `zsh`

Codex's actual config is `codex/.codex/config.toml`, symlinked into `$HOME` with
`stow --no-folding codex`. Edit that TOML directly, like Claude's settings.json.
Use `bash scripts/bootstrap-codex.sh plan|apply|check` for a backed-up migration
when existing files conflict. Never adopt or Stow the entire Codex runtime directory.
Shared Claude/Codex guidance lives in `agent-policy/instructions/`; regenerate
adapters with `node scripts/apply-agent-policy.mjs --codex-only`.

## Skills (not in dotfiles)
Agent behavior lives in [rahulnakmol/skills](https://github.com/rahulnakmol/skills). Bootstrap: `./scripts/bootstrap-skills.sh` (see `skills.manifest.yaml`, `docs/skills.md`).

## Validation
- `zsh -n zsh/.zshrc` — syntax-check shell
- `stylua --check nvim/.config/nvim` — lint Lua (two-space indent, 120 cols)
- `tmux -f tmux/.config/tmux/tmux.conf -L audit new-session -d` — smoke-test tmux
- `ls ~/.cursor/rules` — verify cursor rules symlinked
- `ls ~/.claude/rules` — verify claude rules live
- `node scripts/validate-agent-policy.mjs` — Claude/Cursor/OpenCode secret + shell policy parity vs `agent-policy/catalog.json` (refresh: `node scripts/apply-agent-policy.mjs`)
- `node --test scripts/test-codex-policy.mjs` — shared instruction generation
- Python with `scripts/codex-requirements.txt`: run `scripts/test-codex-config.py` and `scripts/test-codex-sandbox.py` — macOS migration and real sandbox tests

## Platform
macOS (Apple Silicon) with Homebrew as the primary package manager.

## Conventions
- **Commits**: conventional format scoped to module — `feat(zsh): add fzf aliases`
- **Aliases**: universal in `aliases.zsh`, prefixed by utility (`g` git, `d` docker/podman, `cc` claude, `oc` opencode, `b` brew)
- **Theme**: Catppuccin Macchiato everywhere
- **CLI tools**: `eza` over ls, `bat` over cat, `fd`/`rg` over find/grep, `zoxide` for cd

## Security
Never commit tokens or keys. `.gitignore` blocks `hosts.yml`, SSH private keys, `.env`, secrets, tokens. Secrets go in 1Password or env vars sourced from `~/.zshrc.local`.
