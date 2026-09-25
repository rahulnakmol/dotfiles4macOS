# Hotkeys

This is the global shortcut reference for **Raycast Focus & Layouts** with the
core tmux and Herdr modules. Core setup does not require these shortcuts. If you
chose Alfred, use the complete map in the
[Alfred + Karabiner + Rectangle Pro module](modules/alfred.md#hotkeys-and-commands).

| Owner | Launcher or prefix | Purpose |
| --- | --- | --- |
| Raycast | Option+Space | Apps, layouts, focus sessions and windows |
| tmux | Control+A | Terminal sessions, panes and AI client tables |
| Herdr | Control+A | Persistent agent workspaces and popups |

Do not enable the Raycast and Alfred global maps unchanged. They overlap on
launcher, Hyper, window and focus keys.

## Shared macOS and AI-client commands

| Shortcut or command | Action |
| --- | --- |
| Command+Tab / Command+` | Switch apps / windows in an app |
| Control+Left / Control+Right | View previous / next desktop |
| Control+Command+F | Native fullscreen, where supported |
| `cx` | Launch the normal subscription ChatGPT/Codex desktop (`~/.codex`) |
| `codex` | Terminal CLI through the isolated private gateway home |
| `ccf` | Claude Code with the machine-local Fable mapping |
| `cda` / `cds` / `cdg` | Codex with Astra / Sol / Grok mappings |
| Hyper+B | Codex pet in the subscription desktop |
| Hyper+V / Hyper+M | Codex voice / dictation while Codex is focused |

The retired gateway desktop routes (`cxs`, `cxg`, and the two Raycast Script
Commands) are no longer supported. Generic app shortcuts use the one subscription
desktop; CLI credentials remain in the separate gateway home. See [Codex setup](modules/codex.md).

## Raycast Focus & Layouts

The installed extension retains the internal name **Workmode**. Configure aliases
and native hotkeys in Raycast Settings or restore them through Raycast's supported
sync. The tracked JSON files are references, not private-database imports.

### Entry points

| Alias | Action | Suggested hotkey |
| --- | --- | --- |
| `hk` | Modes and actions | Hyper+Space |
| `wl` | Window Layout | Meh+Return |
| `fs` | Focus Session; previews app quits | Meh+F |
| `df` / `ss` | DockFlow Profile / Session Timer | — |
| `wchk` | Check setup | — |
| `cs` | CleanShot menu | Meh+C |
| `clip` / `snip` | Clipboard / snippets | Meh+V / Meh+S |

### Layouts and focus modes

| Mode | Layout | Focus | Dock only | Dock hotkey |
| --- | --- | --- | --- | --- |
| Default | `wff` | — | `dff` | Meh+0 |
| Work | `wwo` | `fwo` | `dwo` | Meh+1 |
| Code | `wco` | `fco` | `dco` | Meh+2 |
| Author | `wau` | `fau` | `dau` | Meh+3 |
| Design | `wde` | `fde` | `dde` | Meh+4 |
| Innovate | `win` | `fin` | `din` | Meh+5 |
| Video | `wvi` | `fvi` | `dvi` | Meh+6 |
| Zen | `wze` | `fze` | `dze` | Meh+9 |

### App keys

| Hyper + | App | Alias |
| --- | --- | --- |
| D / H / F | Zen / Ghostty / Finder | `zen` / `gt` / `ff` |
| J / K / L | ChatGPT-Codex / Cursor / Claude | `cx` / `cu` / `cl` |
| A / N / S | Amp / Obsidian / Slack | `amp` / `ob` / `sl` |
| E / I | Edge / Teams | `edge` / `tm` |
| W / O / P | Word / Excel / PowerPoint | `wd` / `xl` / `ppt` |
| Z / X / C | Final Cut Pro / Motion / Compressor | `fcp` / `mot` / `comp` |
| T / G | Telegram / T3 Code | `tg` / `t3` |
| R / U | Figma / Affinity | `fg` / `af` |

### Window keys

| Control+Option + | Action | Alias |
| --- | --- | --- |
| Return / Forward Delete | Maximize / restore | `wmax` / `wrst` |
| Left / Right | Left / right half | `wlh` / `wrh` |
| Up / Down | Top / bottom half | `wth` / `wbh` |
| D / F / G | First / centre / last third | `w13l` / `w13c` / `w13r` |
| E / T | First / last two-thirds | `w23l` / `w23r` |
| , / . | Move to previous / next Space | `wsp` / `wsn` |
| − / = | Make smaller / larger | `wsm` / `wlg` |

On compact keyboards, Forward Delete is usually Fn+Backspace. Space movement
needs a physical per-Mac test. The [Raycast module](modules/raycast.md) contains
requirements, full mode definitions, desktop assignments and troubleshooting.

## tmux and Herdr

| Prefix/key | Action |
| --- | --- |
| tmux `C-a C` | Enter Claude key table |
| tmux `C-a O` | Enter OpenCode key table |
| tmux `C-a O`, then `p` | OpenCode with the gateway-mapped latest Opus Fast model |
| tmux `C-a D` | Enter Codex key table |
| tmux `C-a D`, then `c/a/S/g` | Codex default / Astra / Sol / Grok popup |
| Herdr `C-a Shift-C/O` | Claude / OpenCode popup |
| Herdr `C-a D` | Gateway Codex popup |

See [tmux](modules/tmux.md) and [Herdr](modules/herdr.md) for their complete local
key tables.

## Verify the map

1. Confirm Raycast owns Option+Space and Spotlight retains Command+Space.
2. Confirm only one active Hyper implementation owns each chord.
3. Test app launch, window movement and Space movement with disposable windows.
4. Test again after logout/login; source files do not prove macOS permissions.
5. Confirm ChatGPT opens with the subscription account and terminal `codex` uses the gateway.
