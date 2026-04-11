# tmux

Terminal multiplexer with Catppuccin Macchiato theme and AI tool integration.

## Files

| File | Target |
|------|--------|
| `.config/tmux/tmux.conf` | `~/.config/tmux/tmux.conf` |

## Key Features

- **Prefix**: `C-a` (Ctrl+a)
- **Theme**: Catppuccin Macchiato with rounded window status
- **AI Integration**: Claude Code (`C-a c`) and OpenCode (`C-a o`) key tables
- **Smart kill**: `C-a x` confirms before killing panes with running processes
- **Vim navigation**: Seamless pane switching with vim-tmux-navigator

## Plugins

Managed by TPM (auto-installed on first launch):

| Plugin | Purpose |
|--------|---------|
| `tpm` | Plugin manager |
| `tmux-sensible` | Sensible defaults |
| `vim-tmux-navigator` | C-h/j/k/l pane navigation |
| `catppuccin/tmux` | Theme |
| `tmux-yank` | System clipboard |

## Deploy

```bash
stow tmux
tmux    # TPM auto-installs on first launch
```

See [tmux-keybindings.md](../guides/tmux-keybindings.md) for full key reference.
