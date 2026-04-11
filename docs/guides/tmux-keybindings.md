# Tmux Keybindings Reference

Prefix: `C-a` (Ctrl+a)

---

## Navigation (no prefix needed)

| Key | Action |
|-----|--------|
| `M-Left` | Select pane left |
| `M-Right` | Select pane right |
| `M-Up` | Select pane up |
| `M-Down` | Select pane down |
| `M-H` | Previous window |
| `M-L` | Next window |
| `C-h/j/k/l` | Pane navigation (via vim-tmux-navigator) |

## Splits & Pane Management (C-a +)

| Key | Action |
|-----|--------|
| `'` | Split horizontal (pane below) |
| `\` | Split vertical (pane right) |
| `x` | Smart kill (instant for shell, confirm for processes) |
| `r` | Reload config |

## Claude Code (C-a c → key table)

| Key | Action |
|-----|--------|
| `c` / `Enter` | Popup session (80x80%) |
| `/` | One-shot prompt (type query, runs in popup) |
| `s` | Split pane — Sonnet with acceptEdits |
| `w` | New window running Claude |
| `o` | Split pane — Opus with acceptEdits |
| `a` | Split pane — Opus autopilot (skip permissions) |
| `p` | Split pane — Opus plan (read-only) |

## OpenCode (C-a o → key table)

| Key | Action |
|-----|--------|
| `o` / `Enter` | Popup session (80x80%) |
| `/` | One-shot run (type query, runs in popup) |
| `s` | Split pane — default model |
| `w` | New window running OpenCode |
| `p` | Popup — Pro agent (Claude Opus) |
| `c` | Popup — Codex agent (GPT) |
| `u` | Popup — UI agent (Gemini Pro) |
| `q` | Popup — Quick agent (MiniMax) |

## Plugins

| Plugin | Purpose |
|--------|---------|
| `tpm` | Tmux Plugin Manager |
| `tmux-sensible` | Sensible default settings |
| `vim-tmux-navigator` | Seamless vim/tmux pane navigation |
| `catppuccin/tmux` | Catppuccin Macchiato theme |
| `tmux-yank` | System clipboard integration |

## macOS Terminal Notes

The `M-` (Meta) keybindings use the **Option (⌥)** key on macOS:

- **Ghostty**: Works out of the box — Option sends Meta by default.
- **iTerm2**: Go to Profiles → Keys → set "Left Option key" to "Esc+" for Meta bindings to work.
- **Terminal.app**: Not recommended — limited Meta key support.

The Claude Code and OpenCode popup bindings (`C-a c`, `C-a o`) use standard Ctrl+a prefix which works in all macOS terminals.

## Plugin Management

| Action | Command |
|--------|---------|
| Install plugins | `C-a I` (capital I) |
| Update plugins | `C-a U` (capital U) |
| Remove unlisted | `C-a alt-u` |
