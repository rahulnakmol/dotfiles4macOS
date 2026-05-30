# Bash

Bash shell config with modular `.bashrc.d/` structure. Mirrors the zsh module for systems where zsh isn't available.

## Deploy

```bash
stow bash
```

This symlinks `~/.bash_profile`, `~/.bashrc`, `~/.bashrc.d/`, and `~/.hushlogin` into `$HOME`.

## Files

| File | Target | Purpose |
|------|--------|---------|
| `.bash_profile` | `~/.bash_profile` | Login shell: env vars, Homebrew, sources .bashrc |
| `.bashrc` | `~/.bashrc` | Interactive shell: PATH, integrations, modular configs |
| `.bashrc.d/00-platform.sh` | `~/.bashrc.d/00-platform.sh` | Platform detection ($DOTFILES_PLATFORM) |
| `.bashrc.d/aliases.sh` | `~/.bashrc.d/aliases.sh` | 120+ aliases (same as zsh module, bash-compatible) |
| `.bashrc.d/catppuccin-fzf-macchiato.sh` | `~/.bashrc.d/catppuccin-fzf-macchiato.sh` | Catppuccin Macchiato fzf colors |
| `.hushlogin` | `~/.hushlogin` | Silence login message |

## Integrations

- **Starship** prompt (`eval "$(starship init bash)"`)
- **Zoxide** smart cd (`eval "$(zoxide init --cmd cd bash)"`)
- **fzf** cached bash integration

## Local overrides

Machine-specific config goes in `~/.bashrc.local` (sourced automatically, not committed).

## Key differences from zsh module

- No `typeset -U PATH` (bash lacks unique-path dedup)
- Uses `shopt -s nullglob` instead of zsh glob qualifiers `(N.)`
- No zsh-specific plugins (syntax-highlighting, autosuggestions, autocomplete)
- `fzf --bash` instead of `fzf --zsh`
