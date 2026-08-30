# tmux

Terminal multiplexer with Catppuccin Macchiato theme and AI tool integration.

## Files

| File | Target |
|------|--------|
| `.config/tmux/tmux.conf` | `~/.config/tmux/tmux.conf` |

## Key Features

- **Prefix**: `C-a` (Ctrl+a)
- **Theme**: Catppuccin Macchiato with rounded window status
- **AI Integration**: Claude Code (`C-a C`), OpenCode (`C-a O`) and Droid (`C-a D`) key tables
- **Session persistence**: layout, working directories and scrollback survive a reboot
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
| `tmux-cpu` | CPU/RAM status modules |
| `tmux-battery` | Battery status module |
| `tmux-pomodoro-plus` | Pomodoro status module |
| `tmux-resurrect` | Saves session layout to disk |
| `tmux-continuum` | Autosaves every 5 min, restores on server start |

## Deploy

```bash
stow tmux
tmux    # TPM auto-installs on first launch
```

TPM and plugins live under `~/.config/tmux/plugins/`, beside `tmux.conf`, not in
the legacy `~/.tmux/`. Both halves must agree: tpm's installer is XDG-aware, so a
tpm cloned to `~/.tmux/plugins/tpm` sources an empty directory and silently loads
nothing — the config parses, options are set, and the theme is simply absent.

## Session persistence

`tmux-resurrect` writes a snapshot to `~/.local/share/tmux/resurrect/`;
`tmux-continuum` autosaves every 5 minutes and restores when the tmux **server**
starts. `tmux new-session -A -s main` is what triggers that: `-A` attaches if the
session exists and creates it otherwise, and creating it starts the server.

Restored: session/window names, pane layout, per-pane working directory, active
pane, scrollback (`@resurrect-capture-pane-contents on`), and Neovim sessions.

**Not restored: running processes.** An in-flight `claude` or `opencode` task is
gone. `@resurrect-processes` is deliberately left at its default allowlist —
auto-relaunching AI CLIs at boot would start unattended sessions that spend
tokens with nobody watching.

`C-a C-s` forces an immediate save; the 5-minute interval is the most you can lose.

See [tmux-keybindings.md](../guides/tmux-keybindings.md) for full key reference.
