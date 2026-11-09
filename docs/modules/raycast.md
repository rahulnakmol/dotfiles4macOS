# Raycast: native workspaces and commands

Updated 31 October 2026. Use native Raycast layouts, Script Commands and
Quicklinks. DockFlow controls the Dock; Session controls focus timers.
No custom extension, npm or developer-mode installation is required.

## Setup

1. Run `bash scripts/setup-raycast-native.sh install` from the repository.
2. Run `bash scripts/setup-raycast-native.sh apps` to install only missing
   Homebrew-managed workspace apps.
3. Add `raycast/.config/raycast/scripts` once in Raycast’s Script Commands settings.
4. Run `bash scripts/setup-raycast-native.sh export-layouts`, then import the JSON
   with Raycast’s **Import Commands & Layouts**. Review display mappings.
5. After import verification, run `bash scripts/setup-raycast-native.sh connect-layouts`.
   Use native Copy Deeplink if your Raycast version emits a different URL.
6. Assign aliases/keys from `workspaces/reference.json`, including the native
   `nativeLayouts` alias list. Import `workspaces/quicklinks.json` for Mobbin.

Configuration is in `raycast/.config/raycast/workspaces/catalog.json`.
Generated wrappers are committed; end users need no build step. Per-Mac settings
stay in `~/Library/Application Support/dotfiles/raycast-workspaces/local.json`.

## Actions, aliases and hotkeys

Workspace (`w…`) applies the DockFlow preset, opens required apps and requests the
native layout. Arrange (`l…`) leaves Dock and timers alone. Focus (`f…`) prepares
the workspace, asks you to confirm window readiness, then requests a Session timer.
Default focus duration is **45 minutes**, with explicit 30/25 choices. Successful
deeplink dispatch alone does not prove the windows were positioned.

| Variant | Workspace | Key after Control–Option | Arrange | Focus |
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

`l` is the layout leader, followed by a two-letter workflow mnemonic. For example,
`las` = Amp + Slack, `lcs` = Cursor + Slack, `ldf` = Design Figma and `lmt` = Meet
Teams. That alias uses Auto selection. Native explicit recipes append `l` for
Laptop or `d` for Desk: `lasl` / `lasd`, `ldfl` / `ldfd`. This gives one category
leader plus two or three mnemonic characters, like the AI alias family.

| Native layout | Alias |
| --- | --- |
| Design Figma \| Laptop | `ldfl` |
| Design Figma \| Desk | `ldfd` |
| Design Affinity \| Laptop | `ldal` |
| Design Affinity \| Desk | `ldad` |
| Work Core \| Laptop | `lwkl` |
| Work Core \| Desk | `lwkd` |
| Work Word \| Laptop | `lwdl` |
| Work Word \| Desk | `lwdd` |
| Work Excel \| Laptop | `lxll` |
| Work Excel \| Desk | `lxld` |
| Work PowerPoint \| Laptop | `lppl` |
| Work PowerPoint \| Desk | `lppd` |
| Remote Work \| Laptop | `lrwl` |
| Remote Work \| Desk | `lrwd` |
| Code: Amp \| Slack \| Laptop | `lasl` |
| Code: Amp \| Slack \| Desk | `lasd` |
| Code: Cursor \| Slack \| Laptop | `lcsl` |
| Code: Cursor \| Slack \| Desk | `lcsd` |
| Write: Notion \| Slack \| Laptop | `lwsl` |
| Write: Notion \| Slack \| Desk | `lwsd` |
| Zen \| Laptop | `lznl` |
| Zen \| Desk | `lznd` |
| Zen Code \| Laptop | `lzcl` |
| Zen Code \| Desk | `lzcd` |
| Meet Teams \| Laptop | `lmtl` |
| Meet Teams \| Desk | `lmtd` |
| Meet Zoom \| Laptop | `lmzl` |
| Meet Zoom \| Desk | `lmzd` |
| Innovate \| Laptop | `livl` |
| Innovate \| Desk | `livd` |

## Workflow apps and Dock presets

| Workflow | Apps | DockFlow | Session category |
| --- | --- | --- | --- |
| Design Figma | Figma + Zen | Design | Design |
| Design Affinity | Affinity + Zen | Design | Design |
| Work Core | Microsoft Edge + Microsoft Teams + Claude | Work | Work |
| Work Word | Microsoft Edge + Microsoft Teams + Microsoft Word + Claude | Work | Work |
| Work Excel | Microsoft Edge + Microsoft Teams + Microsoft Excel + Claude | Work | Work |
| Work PowerPoint | Microsoft Edge + Microsoft Teams + Microsoft PowerPoint + Claude | Work | Work |
| Remote Work | Windows App + Citrix Workspace | Remote work | Work |
| Code: Amp \| Slack | Amp + Slack + Zen + Ghostty + Notion | Code | Code |
| Code: Cursor \| Slack | Cursor + Slack + Zen + Ghostty + Notion | Code | Code |
| Write: Notion \| Slack | Notion + Claude + Zen + Slack | Author | Author |
| Zen | Notion + Claude + Zen | Zen | Zen |
| Zen Code | Zed + Ghostty + Google Chrome Canary + Notion | Code | Code |
| Meet Teams | Microsoft Teams + Notion + Microsoft Edge | Work | Work |
| Meet Zoom | zoom.us + Notion + Zen | Work | Work |
| Innovate | Cursor + Ghostty + Google Chrome Canary + ChatGPT | Innovate | Innovate |

## Window geometry and displays

Layout widths are shown as fractions: `2/3` and `1/3`. Full width means the
entire display. Native recipe files retain their numeric geometry values.

Code places Amp/Cursor beside Slack at 2/3–1/3 on the main display, with Zen/Ghostty
at 2/3–1/3 on support. Notion opens minimized. Zen Code retains Zed/Ghostty and
Canary/Notion. Write uses Notion/Claude on main and Zen/Slack on support.

Design uses a 2/3–1/3 primary-app/Zen pair on Laptop and one full app per Desk display.
Meet uses Teams/Zoom at 2/3 and Notion at 1/3, with a maximized browser on support:
Edge for Teams, Zen for Zoom. Laptop keeps the browser as a maximized reference
behind the meeting-and-notes pair. Wispr Flow starts at login and no workflow
launches or requires it. Its shortcut and Raycast dictation remain independent.
No meeting, recording or transcription is started by these scripts.

Auto selects Laptop for one display, Desk for two. A built-in screen plus two
external displays uses saved external IDs and native main/support indexes.
Recalibrate after changing monitor order. Undocked execution needs a physical
check even when exported recipe definitions match.

Remote Work opens Windows App and Citrix as normal windows. If either client is
already running, the runtime skips layout replay to protect a fullscreen session.
Code minimization checks every minimizable window and excludes utility dialogs
whose AXMinimized attribute is read-only. Failures stop before a timer request.

## Existing standalone commands

`qss` runs **Session: Start Focus**, one Raycast Script Command with Category
and Minutes dropdowns. Categories: Work, Code, Author, Design, Innovate, Zen.
Minutes: 45 (default), 30 or 25. The command requests a Session timer directly,
without changing apps, layout or Dock. It replaces the separate timer Quicklinks;
their six old number hotkeys are released. No global key is assigned to qss.

## Other alias families

- AI: `a` + mnemonic (`ach`, `aqa`, `abug`).
- Snippet commands: `s` + mnemonic (`snp`, `snew`); expansion keywords are separate.
- Quicklinks: `q` + mnemonic (`qmb`, `qls`, `qss`).
- Apple Shortcuts: `k` + mnemonic (`ksr`, `ker`, `kdc`, `ksh`, `kmq`).

Portable references: `alias-families.json`, `apple-shortcuts.json`,
`launchers/reference.json` and `workspaces/reference.json`. Utility command
settings retain their earlier saved assignments. See [all keybindings](../hotkeys.md)
and the [HTML review](../assets/raycast-audit.html).

## Favorites

| Favorite | Alias |
| --- | --- |
| Search Files | fs |
| Focus: Code: Amp \| Slack | fas |
| Focus: Code: Cursor \| Slack | fcs |
| Focus: Zen Code | fzc |
| Focus: Work Core | fwk |
| My Passwords | 1pm |
| Caffeinate for ... | — |
| Toggle Caffeinate | — |
| Toggle System Appearance | — |

Search Files is the explicit hotkey/favorite exception. Other Focus favorites
use aliases rather than additional global keys. Caffeinate for… accepts separate
Hours, Minutes and Seconds fields. Keep no more than ten favorites.

## Verification and recovery

The current catalog has 15 variants, 30 native recipes, 45 Script Commands and
30 explicit-layout mnemonics. The [current recipe export](../assets/native-workspace-layouts-verified.json)
and [cleanup status](../assets/raycast-workspace-installation-status.json) record
verification separately from live execution. Pre-cleanup files and native exports
were backed up outside this repository’s current docs.

Use `node scripts/build-raycast-native.mjs --check`,
`node scripts/build-raycast-launchers.mjs --check` and
`node --test scripts/test-raycast-native.mjs scripts/test-documentation.mjs` for
maintainer validation. Native settings are edited through Raycast UI, never a
private database. Follow [ADR 0006](../adr/0006-native-raycast-workspaces.md).
