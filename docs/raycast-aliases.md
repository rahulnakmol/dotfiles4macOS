# Raycast aliases

Open Raycast with **Option+Space**, type the alias, then press Return.

All aliases are 2–4 lowercase letters/numbers. `dff` is Default. This covers
the apps and commands in our configured setup; third-party extensions keep their
own commands and settings unless explicitly configured here.

Verified in Raycast Settings: 51 existing aliases plus 15 direct layout/focus
aliases added on 13 September 2026. Five optional app
aliases are reserved in source until the apps are installed. Alias registration
does not prove command execution: Move to Previous Space remains disabled until
its incomplete hotkey is cleared or replaced.

## Workmode menus and Dock profiles

| Alias | Command |
|---|---|
| `hk` | Workmode |
| `wl` | Window Layout |
| `fs` | Focus Session |
| `df` | DockFlow Profile |
| `ss` | Session Timer |
| `wchk` | Check Workmode Setup |
| `cs` | Capture |
| `gw` | Google Workspace |
| `dff` | DockFlow: Default |
| `dwo` | DockFlow: Work |
| `dco` | DockFlow: Code |
| `dau` | DockFlow: Author |
| `dde` | DockFlow: Design |
| `din` | DockFlow: Innovate |
| `dvi` | DockFlow: Video |
| `dze` | DockFlow: Zen |

## Direct layouts and focus sessions

| Mode | Window layout | Focus session |
|---|---|---|
| Default | `wff` | — |
| Work | `wwo` | `fwo` |
| Code · Amp | `wco` | `fco` |
| Author | `wau` | `fau` |
| Design | `wde` | `fde` |
| Innovate · Codex | `win` | `fin` |
| Video | `wvi` | `fvi` |
| Zen | `wze` | `fze` |

Focus commands use a dedicated target-and-clock icon in search and mode lists.

Type an alias and press Return to open that mode alone. Press Return again to
**Arrange Windows and Dock**, or **Preview Focus Session**. Focus then shows a
confirmation listing the apps to quit, session duration and category; only
**Start Focus** proceeds. Opening an alias does not launch apps or start a timer.
Optional apps must be installed before applying their modes.

`wl` and `fs` still list all layouts and focus sessions. `df` opens the Dock menu.
Direct `d…` aliases switch only the Dock. For a standalone timer, run `ss`, then
choose 20, 25, 30, 45 or 60 minutes.

Live validation on 13 September 2026: all 17 original aliases were entered in Raycast and
opened the expected single-mode view with the correct layout/preview action.
This validates alias routing, not a new run of window arrangements, app quitting
or Session timers. Automated validation: 36 extension tests, 8 keymap tests and
TypeScript checking passed.

## Windows

`w13l/c/r` means one-third, left/centre/right. `w23l/r` means two-thirds.
`wsp` and `wsn` mean window to Space previous/next, not physical displays.

| Alias | Command |
|---|---|
| `wmax` | Maximize |
| `wrst` | Restore |
| `wlh` | Left Half |
| `wrh` | Right Half |
| `wth` | Top Half |
| `wbh` | Bottom Half |
| `w13l` | First Third |
| `w13c` | Center Third |
| `w13r` | Last Third |
| `w23l` | First Two Thirds |
| `w23r` | Last Two Thirds |
| `wsp` | Move to Previous Space |
| `wsn` | Move to Next Space |
| `wsm` | Make Smaller |
| `wlg` | Make Larger |

## Apps

| Alias | Application | Availability on this Mac |
|---|---|---|
| `zen` | Zen Browser | Configured |
| `gt` | Ghostty | Configured |
| `ff` | Finder | Configured |
| `cx` | ChatGPT / Codex | Configured |
| `cu` | Cursor | Configured |
| `cl` | Claude | Configured |
| `amp` | Amp | Configured |
| `ob` | Obsidian | Configured |
| `edge` | Microsoft Edge | Configured |
| `tm` | Microsoft Teams | Configured |
| `sl` | Slack | Configured |
| `wd` | Microsoft Word | Configured |
| `xl` | Microsoft Excel | Configured |
| `ppt` | Microsoft PowerPoint | Configured |
| `fcp` | Final Cut Pro | Reserved; not installed |
| `mot` | Motion | Reserved; not installed |
| `comp` | Compressor | Reserved; not installed |
| `tg` | Telegram | Reserved; not installed |
| `t3` | T3 Code | Reserved; not installed |
| `fg` | Figma | Configured |
| `af` | Affinity | Configured |

## Everyday utilities

| Alias | Native command |
|---|---|
| `clip` | Clipboard History |
| `snip` | Search Snippets |
| `file` | Search Files |
| `emo` | Search Emoji & Symbols |

## Keeping aliases on another Mac

The canonical list is `raycast/.config/raycast-workstation/aliases.json`, generated
by `node scripts/build-raycast-keymap.mjs` and linked by the optional Raycast Stow
module. It is a portable reference, not a Raycast import format. Stow does not
register native aliases. Use Raycast Cloud Sync for your own devices, or set the
aliases in Raycast Settings on a fresh account. Verify sync and optional apps on
each Mac. Assign apps through native Applications, not duplicate launch wrappers.

The tests enforce unique aliases, 2–4 characters, every configured app, every
Workmode command and every mapped window action. Historical aliases such as
`ddefault`, `dwork`, `dcode` and `wcheck` have been replaced by the shorter forms.

T3 Code was removed from layouts and focus sessions; `ft3` is retired.
Code now uses Amp by default; the duplicate `famp` command is retired. Use `fco` for Amp or `fin` for the Codex alternative, both with Zen, Ghostty and Slack.

Current menu verification (13 September 2026): `fco` shows Amp and `fin` shows Codex, both with Zen, Ghostty and Slack for 45 minutes. `wl` lists eight layouts and `fs` seven focus sessions, with no T3 or duplicate Amp variant. Menus were checked without starting sessions or moving windows. All 55 automated tests and TypeScript checking passed.
