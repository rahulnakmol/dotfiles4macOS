# zsh

Shell configuration with modular `.zshrc.d/` architecture.

## Files

| File | Target | Purpose |
|------|--------|---------|
| `.zprofile` | `~/.zprofile` | Login-session env vars (GOPATH, CARGO_HOME, etc.) |
| `.zshrc` | `~/.zshrc` | Interactive shell setup (prompt, plugins, integrations) |
| `.hushlogin` | `~/.hushlogin` | Suppress macOS login message |
| `.zshrc.d/00-platform.zsh` | `~/.zshrc.d/` | Platform detection (`$DOTFILES_PLATFORM`) |
| `.zshrc.d/aliases.zsh` | `~/.zshrc.d/` | 120+ universal aliases |
| `.zshrc.d/catppuccin-fzf-macchiato.sh` | `~/.zshrc.d/` | FZF Catppuccin color theme |
| `.zshrc.d/README.md` | `~/.zshrc.d/` | Alias reference documentation |

`~/.local/bin` intentionally precedes `~/.opencode/bin`, so private-gateway `claude`, `codex` and
`opencode` wrappers win. `ccf`, `cda`, `cds` and `cdg` resolve Fable, Astra, Sol and Grok from the
authenticated machine-local mapping created by `scripts/setup-private-ai-gateway.sh`; no model ID is
tracked in the alias file. Existing `ccs`, `cco` and other Claude aliases use the same wrapper.

## Dependencies

`starship`, `zoxide`, `fzf`, `eza`, `bat`, `zsh-syntax-highlighting`, `zsh-autocomplete`, `zsh-autosuggestions`

```bash
brew install starship zoxide fzf eza bat zsh-syntax-highlighting zsh-autocomplete zsh-autosuggestions
```

## Architecture

- `.zprofile` runs once on login — sets env vars and initializes Homebrew
- `.zshrc` runs on every interactive shell — sources `.zshrc.d/*.{zsh,sh}` in sort order, sets up prompt and plugins
- `00-platform.zsh` loads first (numeric prefix) and exports `$DOTFILES_PLATFORM`
- Aliases are universal (no platform guards needed on macOS)
- Local overrides: `~/.zshrc.local` (not committed)

## Deploy

```bash
stow zsh
```
