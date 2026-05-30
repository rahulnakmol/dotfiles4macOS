# Dotfiles — GNU Stow

Each top-level folder is a stow module that symlinks into `$HOME`. Deploy: `stow <module>`. Dry-run: `stow -n <module>`.

## Modules
`1password` `bat` `claude` `cursor` `gh` `ghostty` `git` `iTerm2` `nvim` `opencode` `ssh` `starship` `tmux` `zed` `zsh`

## Validation
- `zsh -n zsh/.zshrc` — syntax-check shell
- `stylua --check nvim/.config/nvim` — lint Lua (two-space indent, 120 cols)
- `tmux -f tmux/.config/tmux/tmux.conf -L audit new-session -d` — smoke-test tmux
- `ls ~/.cursor/rules` — verify cursor rules symlinked

## Platform
macOS (Apple Silicon) with Homebrew as the primary package manager. The shell config auto-detects the platform via `uname -s` and sets `$DOTFILES_PLATFORM`.

## Conventions
- **Commits**: conventional format scoped to module — `feat(zsh): add fzf aliases`
- **Aliases**: universal in `aliases.zsh`, prefixed by utility (`g` git, `d` docker, `cc` claude, `oc` opencode, `b` brew)
- **Theme**: Catppuccin Macchiato everywhere
- **CLI tools**: `eza` over ls, `bat` over cat, `fd`/`rg` over find/grep, `zoxide` for cd

## Security
Never commit tokens or keys. `.gitignore` blocks `hosts.yml`, SSH private keys, `.env`, secrets, tokens. Secrets go in 1Password or env vars sourced from `~/.zshrc.local`.
