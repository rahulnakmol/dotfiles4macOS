# claude

Claude Code configuration — settings, keybindings, and custom statusline.

## Files

| File | Target |
|------|--------|
| `.claude/settings.json` | `~/.claude/settings.json` |
| `.claude/keybindings.json` | `~/.claude/keybindings.json` |
| `.claude/statusline.sh` | `~/.claude/statusline.sh` |

## Settings

- **Statusline**: Custom Catppuccin-themed bash script showing model, git branch, vim mode, and context window usage
- **Plugins**: 31 official plugins enabled (LSPs, code review, security, data, etc.)

## Keybindings

19 context-specific binding groups covering Chat, Autocomplete, Settings, Scroll, Vim-style navigation, and more. Highlights:

| Key | Context | Action |
|-----|---------|--------|
| `meta+p` | Chat | Model picker |
| `meta+o` | Chat | Toggle fast mode |
| `meta+t` | Chat | Toggle thinking |
| `cmd+c` | Scroll | Copy selection (macOS) |
| `j`/`k` | Settings/Select | Vim-style navigation |

## Install

```bash
brew install claude
stow claude
```

## Shell Aliases

See `cc*` aliases in `zsh/.zshrc.d/aliases.zsh` and tmux `C-a c` key table.

## macOS Notes

- `cmd+c` for copy is included alongside `ctrl+shift+c` (Linux)
- `meta+` bindings use the Option (⌥) key on macOS
