# Tmux Keybindings Reference

**Prefix:** `C-a` (Ctrl+a) — replaces the default `C-b`.

Notation: `prefix <key>` means press `C-a`, release, then press `<key>`.

---

## Custom bindings

### Navigation (no prefix)

| Key | Action |
|-----|--------|
| `M-←` / `M-→` / `M-↑` / `M-↓` | Select pane in direction |
| `M-H` | Previous window |
| `M-L` | Next window |
| `C-h` / `C-j` / `C-k` / `C-l` | Pane nav across vim splits (vim-tmux-navigator) |

### Splits & pane management (with prefix)

| Key | Action |
|-----|--------|
| `'` | Split horizontal (pane below) — `'` looks like `─` |
| `\` | Split vertical (pane right) — `\` looks like `│` |
| `x` | Smart kill — instant for shell, confirm prompt for running processes |
| `r` | Reload `~/.config/tmux/tmux.conf` |

### Claude Code — `prefix C` enters the `claude` key table

| Key | Action |
|-----|--------|
| `c` / `Enter` | Popup session (80×80%) — default model |
| `/` | One-shot prompt (asks for query, runs in popup) |
| `s` | Split pane — Sonnet with `--permission-mode acceptEdits` |
| `o` | Split pane — Opus with `--permission-mode acceptEdits` |
| `a` | Split pane — Opus autopilot (`--dangerously-skip-permissions`) |
| `p` | Split pane — Opus plan mode (read-only) |
| `w` | New window running Claude |

### OpenCode — `prefix O` enters the `opencode` key table

| Key | Action |
|-----|--------|
| `o` / `Enter` | Popup session — default model |
| `/` | One-shot run (asks for query, runs in popup) |
| `s` | Split pane — default model |
| `w` | New window running OpenCode |
| `p` | Popup — Pro agent (`opencode/claude-opus-4-6`) |
| `c` | Popup — Codex agent (`opencode/gpt-5.3-codex`) |
| `u` | Popup — UI agent (`opencode/gemini-3.1-pro`) |
| `q` | Popup — Quick agent (`opencode/minimax-m2.5`) |

> Capital `C` and `O` were chosen so they don't shadow tmux defaults
> `prefix c` (new window) and `prefix o` (next pane).

---

## Default tmux bindings still in use

These ship with tmux and are not overridden in this config.

### Windows

| Key | Action |
|-----|--------|
| `prefix c` | Create new window |
| `prefix ,` | Rename current window |
| `prefix &` | Kill current window (with confirm) |
| `prefix n` | Next window |
| `prefix p` | Previous window |
| `prefix 0`–`9` | Jump to window by index |
| `prefix l` | Last (most recent) window |
| `prefix w` | Choose window/pane from tree |
| `prefix f` | Find window by name |
| `prefix .` | Move window to a different index |

### Panes

| Key | Action |
|-----|--------|
| `prefix o` | Cycle to next pane |
| `prefix ;` | Last (previously active) pane |
| `prefix q` | Show pane numbers (press number to jump) |
| `prefix z` | Toggle pane zoom |
| `prefix !` | Break pane out into a new window |
| `prefix x` | (overridden — see *smart kill* above) |
| `prefix {` / `prefix }` | Swap pane with previous / next |
| `prefix space` | Cycle through preset layouts |
| `prefix M-1`–`M-5` | Apply preset layout (even/main-h/main-v/tiled) |
| `prefix C-↑/↓/←/→` | Resize pane by 1 cell |
| `prefix M-↑/↓/←/→` | Resize pane by 5 cells |

### Sessions

| Key | Action |
|-----|--------|
| `prefix d` | Detach from session |
| `prefix s` | Choose session |
| `prefix $` | Rename session |
| `prefix (` / `prefix )` | Switch to previous / next session |
| `prefix L` | Switch to last (most recent) client |

### Copy mode & buffers

| Key | Action |
|-----|--------|
| `prefix [` | Enter copy mode (vi keys; `q` to exit) |
| `prefix ]` | Paste most recent buffer |
| `prefix =` | Choose buffer to paste |
| `prefix #` | List paste buffers |

### Misc

| Key | Action |
|-----|--------|
| `prefix ?` | Show all key bindings |
| `prefix :` | Command prompt |
| `prefix t` | Clock display (any key exits) |
| `prefix ~` | Show recent messages |
| `prefix C-a` | Send literal `C-a` to the running program |

---

## Plugin bindings

### TPM (plugin manager)

| Key | Action |
|-----|--------|
| `prefix I` | Install declared plugins |
| `prefix U` | Update plugins |
| `prefix M-u` | Remove plugins not in the config |

### tmux-yank (system clipboard)

| Key | Action |
|-----|--------|
| `prefix y` | Copy current command line to clipboard |
| `prefix Y` | Copy current pane's working directory |
| In copy mode: `y` | Copy selection to clipboard |
| In copy mode: `Y` | Copy selection and paste it |

### vim-tmux-navigator

`C-h` / `C-j` / `C-k` / `C-l` — see *Navigation* above. Works seamlessly between tmux panes and Vim/Neovim splits.

---

## Plugins loaded

| Plugin | Purpose |
|--------|---------|
| `tmux-plugins/tpm` | Plugin manager |
| `tmux-plugins/tmux-sensible` | Sensible default settings |
| `christoomey/vim-tmux-navigator` | Vim/tmux unified pane nav |
| `catppuccin/tmux` | Catppuccin Macchiato theme (v2.3.0 syntax) |
| `tmux-plugins/tmux-yank` | System clipboard integration |

---

## macOS terminal notes

The `M-` (Meta) bindings use the **Option (⌥)** key:

- **Ghostty** — Works out of the box (Option sends Meta).
- **iTerm2** — Profiles → Keys → set "Left Option key" to **Esc+**.
- **Terminal.app** — Limited Meta support; not recommended.

`C-a`-prefixed bindings work everywhere.
