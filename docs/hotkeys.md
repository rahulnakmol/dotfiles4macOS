# Hotkeys

Global shortcut reference for **Raycast Focus & Layouts**, tmux and Herdr.
The 17 October app/window audit is historical; the native workspace map below is
installed and verified on 18 October. A reference file alone does not register a key.
See [setup and current architecture](modules/raycast.md) and the
[full HTML review](assets/raycast-audit.html) for aliases, recommendations and status.

## Raycast Focus & Layouts

Native layouts + Raycast Script Commands + Quicklinks. No Hyper map is required.

| Layer | Role |
| --- | --- |
| Option + letter / Option–Shift + letter | Application launchers |
| Option (+ Shift) + punctuation | Window management |
| Control–Option + letter | Workspace: DockFlow + native layout, no timer |
| Control–Option (+ Shift) + number | Existing DockFlow / standalone Session controls |
| `w…` / `l…` / `f…` aliases | Workspace / layout only / Focus (45 minutes default; explicit 25/30) |

### Category alias leaders

Quicklinks use **q**, snippets **s**, AI **a**, Apple Shortcuts **k**, and layouts
**l**, followed by two or three mnemonic characters. `qss` is the standalone
Session timer command with Category and Minutes dropdowns; default 45 minutes.

| Family | Examples |
| --- | --- |
| Quicklinks / Session | `qls` search, `qmb` Mobbin, `qss` start Session |
| Snippet commands | `snp` search, `snew` create, `sexp` export |
| AI | `ach` chat, `aqa` Quick AI, `abug` Find Bugs |
| Layouts | `las` Auto Amp + Slack, `lasl` Laptop, `lasd` Desk |

### Apple Shortcuts aliases

Apple Shortcuts use **`k` + a two- or three-letter mnemonic**, like the `q…`
Quicklink family. Type the whole alias in Raycast, then Return. This is an alias
prefix rather than a separate leader-key mode. The current five are three characters
in total and were saved and verified in native Settings on 19 October.

| Shortcut | Alias |
| --- | --- |
| Start Reading | `ksr` |
| End Reading | `ker` |
| Quick Dictation to Clipboard | `kdc` |
| Log into SHELL | `ksh` |
| Music Quiz | `kmq` |

No additional global hotkeys were assigned and no shortcuts were executed during
setup. Portable reference: `raycast/.config/raycast/apple-shortcuts.json`.

### Workflow aliases and keys

All keys include **Control–Option**. The current setup has 15 variants, 30 native
Laptop/Desk recipes and 45 Script Commands. Code uses Slack on A/X. Write with
Slack keeps Shift–O. Zen Code remains on G. Meeting commands open Teams + Notion + Edge or Zoom + Notion + Zen. Wispr Flow
starts at login and is not launched by any workflow. Focus defaults to 45 minutes, with
30/25 available after confirming readiness.

| Variant | Workspace | Key | Arrange only | Focus |
| --- | --- | --- | --- | --- |
| Design Figma | `wdf` | v | `ldf` | `fdf` |
| Design Affinity | `wda` | shift+v | `lda` | `fda` |
| Work Core | `wwk` | s | `lwk` | `fwk` |
| Work Word | `wwd` | w | `lwd` | `fwd` |
| Work Excel | `wxl` | e | `lxl` | `fxl` |
| Work PowerPoint | `wpp` | p | `lpp` | `fpp` |
| Remote Work | `wrw` | r | `lrw` | `frw` |
| Code: Amp \| Slack | `was` | a | `las` | `fas` |
| Code: Cursor \| Slack | `wcs` | x | `lcs` | `fcs` |
| Write: Notion \| Slack | `wws` | shift+o | `lws` | `fws` |
| Zen | `wzn` | z | `lzn` | `fzn` |
| Zen Code | `wzc` | g | `lzc` | `fzc` |
| Meet Teams | `wmt` | m | `lmt` | `fmt` |
| Meet Zoom | `wmz` | shift+m | `lmz` | `fmz` |
| Innovate | `wiv` | i | `liv` | `fiv` |

### Layout mnemonic family

`l` means layout. The next two letters identify the workflow: `las` means Amp +
Slack, `lcs` Cursor + Slack, `lws` Write + Slack, `ldf` Design Figma and `lmt` Meet
Teams. The three-character form uses Auto display selection. Append `l` for the
explicit Laptop layout or `d` for Desk: `lasl` / `lasd`, `ldfl` / `ldfd`.
This matches the category-leader convention used by AI, Quicklinks and snippets.
Native explicit layouts have aliases only; their scripts own the global keys.

### Workflow migration

Control–Option A/S/X belong to workspace Script Commands. Native layout entries
do not receive duplicate global keys. Retired mode aliases and keys are free.
Center Half remains Option–Shift–/ (`chf`); Control–Option G remains Zen Code.

### App keys

| Key | App | Alias |
| --- | --- | --- |
| option+a | Amp | `amp` |
| option+s | Zen | `zen` |
| option+shift+s | Google Chrome Canary | `chr` |
| option+d | Claude | `cl` |
| option+shift+d | ChatGPT / Codex interface | `cx` |
| option+x | Cursor | `cu` |
| option+g | Ghostty | `gt` |
| option+shift+g | Terminal | `trm` |
| option+h | Windows App | `rdp` |
| option+f | Finder | `ff` |
| option+k | 1Password | `1p` |
| option+shift+k | System Settings | `ss` |
| option+o | Obsidian | `ob` |
| option+shift+o | Notes | `nt` |
| option+j | Things | `th` |
| option+shift+j | Calendar | `day` |
| option+l | Adobe Acrobat | `acr` |
| option+c | CleanShot X | `cs` |
| option+shift+c | Session | `ses` |
| option+e | Zed | `zed` |
| option+m | Mail | `ml` |
| option+shift+m | Messages | `msg` |
| option+n | Antinote | `an` |
| option+shift+n | Remind Me Faster | `rmf` |
| option+w | Microsoft Word | `wrd` |
| option+shift+w | Microsoft Excel | `xl` |
| option+v | Figma | `fg` |
| option+shift+v | Affinity | `af` |
| option+r | Citrix Workspace | `cw` |
| option+shift+r | Preview | `pv` |
| control+option+shift+s | Microsoft Edge | `edg` |
| control+option+shift+w | Microsoft PowerPoint | `ppt` |

Command–Enter opens the dynamic default-browser Script Command; Command–Shift–Enter
launches Ghostty. Option–G uses the separate Launch Ghostty script so the native
application can retain Command–Shift–Enter. Browser app shortcuts remain Zen /
Chrome Canary / Edge on Option-S / Option–Shift-S / Control–Option–Shift-S.
Option–Shift-F and Option–Shift-H remain free for Cursor formatting and tmux M-H.

### Window keys

| Key | Action | Alias |
| --- | --- | --- |
| option+[ | Left Half | `lft` |
| option+] | Right Half | `rgt` |
| option+shift+[ | First Two Thirds | `l23` |
| option+shift+] | Last Two Thirds | `r23` |
| option+; | First Three Fourths | `l34` |
| option+' | Last Three Fourths | `r34` |
| option+, | Move to Previous Display | `pdp` |
| option+. | Move to Next Display | `ndp` |
| option+shift+, | Move to Previous Space | `psp` |
| option+shift+. | Move to Next Space | `nsp` |
| option+\ | Maximize | `max` |
| option+shift+\ | Almost Maximize | `alm` |
| option+/ | Center | `ctr` |
| option+shift+/ | Center Half | `chf` |
| option+shift+` | Restore | `rst` |
| option+shift+; | First Third | `l13` |
| option+shift+' | Last Third | `r13` |
| option+- | Make Smaller | `sml` |
| option+= | Make Larger | `big` |
| option+shift+- | Bottom Half | `btm` |
| option+shift+= | Top Half | `top` |

Keep Option arrows/Delete with text editing. Remote fullscreen desktop behavior
needs a real connection test; global local hotkeys may intercept remote chords.

### Numbers and gestures

| Key | Action | Alias |
| --- | --- | --- |
| option+1 | Search Files | `fs` |
| option+2 | Capture Area | `csa` |
| option+3 | Search Screenshots | `pic` |
| option+4 | Open History | `csh` |
| option+5 | Clipboard History | `cb` |
| option+6 | Search Snippets | `snp` |
| option+7 | AI Chat | `ach` |
| option+8 | Ask Selected Text | `ast` |
| option+9 | My Pull Requests | `pr` |
| option+0 | Search Repositories | `gh` |
| option+shift+1 | Ask Terminal | `atr` |
| option+shift+2 | Capture Text (OCR) | `ocr` |
| option+shift+3 | Scrolling Capture | `csc` |
| option+shift+4 | My Schedule | `ms` |
| option+shift+9 | Search Pull Requests | `prs` |
| option+shift+0 | Workflow Runs | `ci` |
| double_left_option | Dictate | `dic` |
| double_left_shift | Search Quicklinks | `qls` |
| double_left_control | Quick AI | `aqa` |
| double_right_command | Send Focused Window to AI | `afw` |

The standalone Session command `qss` has Category and Minutes dropdowns. It
replaces the separate timer links and releases their six old number shortcuts.
Control–Option numbers still select DockFlow presets. See
[Session/DockFlow setup](modules/raycast.md#existing-standalone-commands).

### Favorites saved in Raycast

Nine favorites were selected, saved and verified in this order on 19 October 2026.
The cap is ten. Prefer hotkeys for other commands; Search Files is an explicit
exception. Focus defaults to 45 minutes after readiness confirmation, with 30/25 optional.

| Favorite | Alias | Type |
| --- | --- | --- |
| Search Files | `fs` | Retrieval |
| Focus: Code: Amp \| Slack | `fas` | Focus |
| Focus: Code: Cursor \| Slack | `fcs` | Focus |
| Focus: Zen Code | `fzc` | Focus |
| Focus: Work Core | `fwk` | Focus |
| My Passwords | `1pm` | 1Password |
| Caffeinate for ... | — | Coffee |
| Toggle Caffeinate | — | Coffee |
| Toggle System Appearance | — | System |

Caffeinate for ... exposes separate Hours, Minutes and Seconds fields. Its form
was inspected without changing the running caffeination state. The three utility
commands marked — have no saved alias or global hotkey. The existing screenshot,
clipboard, GitHub and timer-free workspace hotkeys remain available.

The portable list lives in `raycast/.config/raycast/workspaces/favorites.json`.
To reproduce it, select each command in Root Search and use **Add to Favorites**
in the Action Panel (Command–K; search “favorite”), or Command–Shift–F. The shortcut
is a toggle: do not run it blindly on an already-favorited command. Reordering is
available through native favorite actions; the installer does not write private
Raycast preferences.

Clipboard History is verified on `cb` / Option–5. Ask Clipboard uses `acb` with no
global key; the earlier accidental assignment of Option–5 to Ask Clipboard was
corrected during this pass.

### Alias categories

AI uses `a…`; Quicklinks use `q…`; snippet commands use `s…`; workflow actions use
`w…/l…/f…`. Familiar aliases such as `bin` can remain exceptions. The older full
alias map is a migration reference; not every AI/Quicklink/snippet alias has been
renamed into the agreed category scheme yet.

Native aliases accept lowercase letters, numbers and spaces, not punctuation.
Snippet expansion keywords such as `!sig` are separate; browser bangs are query
text sent to a search Quicklink. Do not treat `@`, `!` or `#` as native command
category menus. Review expansion behavior in terminals/editors before enabling it.

## tmux and Herdr

| Prefix/key | Action |
| --- | --- |
| tmux Control-A | Prefix; preserve existing pane/window navigation |
| tmux `C-a C` | Claude table |
| tmux `C-a O` | OpenCode table |
| tmux `C-a D` | Codex table |
| Herdr `C-a Shift-C/O` | Claude / OpenCode popup |
| Herdr `C-a D` | Gateway Codex popup |

See [tmux](modules/tmux.md) and [Herdr](modules/herdr.md) for complete local maps.

## Verify the map

Test app launch, window movement, workspace setup and explicit timer start on
both display configurations. Native settings persistence does not prove layout
execution. Keep your configured launcher key; this Mac currently uses Command-Space for
Raycast. The installer does not change Spotlight or the launcher shortcut. Disable overlapping launcher/remapper keys after replacements are verified.
The custom Workmode extension and its Hyper/Meh reference have been retired.
