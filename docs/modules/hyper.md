# Hyper on macOS

The single Karabiner profile is **Hyperland**. Hold Caps Lock for Hyper
(Control+Option+Command+Shift); tap it for Escape. Right Option is Meh
(Control+Option+Shift) for shared tools and DockFlow; Left Option remains normal. This setup borrows Omarchy's
keyboard-first structure while using Alfred, Karabiner and Rectangle Pro on macOS.

Open the [illustrated Hyper guide](../../alfred/.config/alfred/Alfred.alfredpreferences/workflows/user.workflow.hyper/guide.html)
with Hyper+/ for the complete map, workspace diagrams, research and limitations.
Hyper+Space opens the searchable command menu. Alfred keywords are `hyper`, `work`,
`code`, `zen` and `default`.

Setup checkpoint, September 8, 2026: all 37 focus, bootstrap, launcher, Hyper and Codex policy tests
pass. The approved tactile map gives each of the 18 apps exactly one direct shortcut. Letters prioritize coding/work apps and
voice; punctuation and arrows control windows. Native Desktop 1…10 shortcuts are
saved, with unrelated keyboard shortcuts preserved. The running Hyperland profile
has all five rules enabled and no bracket navigation alias. Rectangle’s native
import has been applied; live thirds and two-thirds settings match the snapshot.
Alfred, Karabiner, Rectangle, Ghostty and Codex Stow targets were verified. Log out and back in to
activate command-line desktop changes. Physical tests of the latest bindings,
desktop creation/placement, a fresh login and the second Mac require local checks.
See the [design decision](../adr/0002-hyper-macos-workspaces.md).

## Focus sessions and complete manual

The [hotkeys manual](../hotkeys.md) and [standalone visual page](../hotkeys.html)
cover Work plus the four Code variations. Alfred commands are `focus work`,
`focus amp`, `focus claude`, `focus cursor` and `focus codex`. A session switch quits outgoing
apps normally, then opens its exact app set. Code uses two ordinary desktops:
Chrome (Amp/Cursor/Codex) or Obsidian (Claude) with Ghostty in a ⅔–⅓ split on Desktop 1,
and the selected coding app maximized on Desktop 2. The earlier four choices were verified in Alfred; Code · Codex adds a fifth
session and a sixteenth Rectangle layout. A live quit/reopen session and native desktop assignment still
need acceptance. Set the per-Mac native Dock
assignments described in the manual; Rectangle sizes windows but cannot assign
numbered Spaces. The prior general layout commands remain available.

## Shared Meh actions

Meh+A opens Universal Actions, V clipboard history, S snippets, C CleanShot X
capture tools, Space system tools, and Return the layout chooser. DockFlow number
keys stay unchanged. See [bootstrap, native keys and rollback](hyper-bootstrap.md)
for fresh-Mac setup and the exact verification boundaries. Hyper+/ includes the
Meh and native shortcut tables.

## Daily keys

| Hyper + | App | Position / purpose |
| --- | --- | --- |
| A | Amp | Left home: Zen coding |
| S | Slack | Left home: communication |
| D | Google Chrome | Left home: development browser |
| F | Finder | Left home: files |
| H | Ghostty | Right home: terminal |
| J | ChatGPT / Codex | Right home: agent |
| K | Cursor | Right home: editor |
| L | Claude | Right home: coding and work assistant |
| W | Word | Nearby work documents |
| E | Microsoft Edge | Nearby work browser |
| I | Microsoft Teams | Nearby work communication |
| O | Excel | Nearby spreadsheets |
| P | PowerPoint | Presentations |
| R | Safari | Secondary browser |
| N | Obsidian | Notes |
| Z | Final Cut Pro | Media: edit |
| X | Motion | Media: animate |
| C | Compressor | Media: export |

Final Cut Pro, Motion and Compressor are mapped but not installed on this MacBook
Air. Their shortcuts work on Macs where the apps are installed; this configuration
does not install or download them. Bundle identifiers were verified against
[Apple’s app metadata](https://itunes.apple.com/lookup?id=424389933,434290957,424390742&country=us)
on September 8, 2026: `com.apple.FinalCut`, `com.apple.motionapp`,
and `com.apple.Compressor`. Safari uses `com.apple.Safari`.

Each app has exactly one direct Hyper shortcut. Ghostty uses H; Return maximizes
the current window. B, G, Q, T, U and Y are unassigned. The right home cluster
keeps terminal, agent, editor and assistant together while Caps Lock is held by
the other hand; media does not occupy a home-row key.

| Hyper + | Action |
| --- | --- |
| V / M | Voice chat / dictation, inside Codex only |
| Return / Backspace | Maximize / restore geometry |
| Tab / backtick | Previous app / next window of this app |
| 1…9 / 0 | Switch to existing Desktop 1…9 / 10 |
| Up / Down | Mission Control / app windows |
| , / . | Left / right half |
| [ / ] / backslash | Left / centre / right third |
| ; / ' | Left / right two-thirds |
| − / = | Move current window to previous / next desktop |
| Left / Right | Move current window to previous / next display |
| Space / slash | Alfred command menu / this guide |

The bracket/backslash keys follow physical left-to-right order for thirds.
Control+Left/Right switches adjacent desktops; the Hyper bracket aliases are removed.

Meh+0/1/2/3/4/5/9 select the DockFlow Default/Work/Code/Author/Create/Video/Zen
profiles. Codex uses Hyper+V for voice chat and Hyper+M for dictation; all other
Codex actions inherit their defaults. Focus Codex with Hyper+J before using them.
Apps keep the same key in every mode. There is no hidden mode-dependent keymap.

The installed ChatGPT app currently has bundle identifier `com.openai.codex` and
hosts Codex too. Hyper+J targets that bundle independent of the app's filename.
Amp has a real desktop bundle and Hyper+A focuses it; nothing is typed into a shell.

## Layouts and desktops

| Layout | Windows | Opens closed apps |
| --- | --- | --- |
| Work | Edge left ⅔, Teams right ⅓ | Yes |
| Work Balanced | Edge / Teams halves | Yes |
| Office | Word / Excel halves | Yes |
| Present | PowerPoint maximized | Yes |
| Code | Chrome left ⅔, Slack right ⅓ | Yes |
| Code Balanced | Chrome / Slack halves | Yes |
| Terminal | Ghostty maximized | Yes |
| Agents | Open Codex, Claude, Cursor, Amp windows maximized | No |
| Zen | Open Amp, Cursor, Ghostty, Obsidian windows maximized | No |
| Default | Current app window maximized | No |

Work-family, Code-family, Zen and Default commands first invoke the matching
DockFlow profile, then Rectangle's layout URL. Terminal does not change DockFlow.
They do not create documents, start agent tasks, quit apps, hide other apps or
change the default browser. One matching normal window per app is arranged.
For Agents and Zen, launch the apps you want with their keys before applying the
layout. Work Balanced and Code Balanced help when app minimum widths prevent thirds.

Suggested three-desktop structure:

| Mode | Desktop 1 | Desktop 2 | Desktop 3 |
| --- | --- | --- | --- |
| Work | Work: Edge + Teams | Office: Word + Excel | Claude maximized, or Present |
| Code | Code: Chrome + Slack | Terminal: Ghostty | Agents: editor/agent windows |
| Zen | Chosen editor + Ghostty + Obsidian, maximized and overlapping | Optional | Optional |

Create ordinary desktops using Mission Control's + button on each Mac. Visit each
desktop, move windows there with Hyper+−/=, then apply that desktop's layout.
Hyper+1…9/0 selects Desktop 1…9/10; it does not create a missing desktop.
Native Control+Left/Right switches adjacent desktops without moving a window. Use Hyper+Tab or the app
keys to switch between overlapping maximized apps.

**Exact numbered-Space restoration is not implemented by this stack.** Rectangle
layouts control geometry; they do not gather every window from arbitrary Spaces.
Its previous/next-Space action simulates a title-bar drag during native desktop
navigation. Native fullscreen creates a separate Space, so leave fullscreen before
ordinary layouts. Static Dock > Options > This Desktop assignments can be used for
apps with permanent homes; shared apps such as Claude and Ghostty should usually
remain unassigned. See [Apple's Spaces guide](https://support.apple.com/en-euro/guide/mac-help/mh14112/mac)
and the [Rectangle maintainer's explanation](https://github.com/rxhanson/RectanglePro-Community/discussions/689).

## Move to another Mac

```sh
brew install --cask alfred karabiner-elements rectangle-pro
cd ~/.dotfiles
stow -n -v alfred karabiner rectangle-pro
stow alfred karabiner rectangle-pro
bash scripts/setup-hyper-macos.sh plan
bash scripts/setup-hyper-macos.sh apply
bash scripts/setup-hyper-macos.sh check
```

Back up conflicting existing configurations before Stow; never use `stow --adopt`.
Karabiner must use a directory link, not an individual karabiner.json symlink.
Set Alfred's preferences folder to `~/.config/alfred` and select **Hyperland** in
Karabiner. In Rectangle Pro > App Settings > Import Config select
`~/.config/rectangle-pro/RectangleProConfig.json`.

The Mission Control helper enables Control+Option+1…9/0, disables automatic Space
rearrangement, and enables switching to an app's existing Space when activated.
It backs up the managed settings under `~/.local/state/dotfiles/backups/hyper-mission-control-*` and does
not restart the Dock. Log out and back in after applying these preferences.
For rollback, restore each saved 0/1 with `defaults write com.apple.dock KEY -bool
false/true`; if the saved value is `unset`, use `defaults delete com.apple.dock KEY`.
The backup’s `desktop-shortcuts.json` records the previous native shortcut entries
118–127 (null means absent). Restore only these dictionary entries when rolling
back; do not replace the entire macOS keyboard-shortcut dictionary.

On each Mac, create the desktops, keep Control+Left/Right and Control+Up/Down
enabled in Keyboard > Keyboard Shortcuts > Mission Control, activate licenses and
complete required Karabiner/Alfred/Rectangle permissions directly. Enable Alfred,
Rectangle Pro and DockFlow at login; Karabiner's background services provide its
startup. Do not turn on Raycast's Hyper remapper again. Alfred's main Cmd+Space
hotkey and several preferences are machine-specific.

Transfer DockFlow's presets using its private Backup & Restore UI, then compare
Integrations links with the owned DockFlow workflow. Import may produce different
UUIDs: update that workflow's URLs, then regenerate Hyper. Do not copy its live
database or Space UUIDs between Macs. Install the desired apps separately; this
setup does not silently install every work app. External-monitor topology remains
device-specific; layouts leave the destination display unchanged and use fractions.

## Maintain and verify

The editable source is `scripts/hyper-config.json`. It generates the managed
Karabiner rules, Rectangle `appSpecs`, and owned Hyper workflow. Other Karabiner
rules and unrelated Rectangle shortcuts are preserved. The generator manages
Rectangle’s thirds and two-thirds shortcuts and the owned DockFlow workflow’s Meh modifiers. Existing user-created Rectangle
layouts must be merged into the source before reimporting this snapshot.

```sh
node scripts/build-hyper-config.mjs
node scripts/render-hyper-guide.mjs
node scripts/build-hyper-config.mjs --check
node --test scripts/test-launcher-config.mjs scripts/test-hyper-config.mjs
```

Reimport Rectangle after changing a layout or its shortcuts. Karabiner and Alfred read the live
Stow-backed source. Generated workflow source, its guide and icon are explicitly
allowlisted; local variables, credentials, licenses, window titles and runtime
data stay out of Git. Source is local until committed and pushed.

Check physical Caps+H/F/J, Hyper+Space, Hyper+Return, desktop switch/move keys and the
Meh+number DockFlow shortcuts after each install. Confirm thirds fit on the actual
display; use Balanced or maximize when minimum window sizes cause overlap. Verify
again after a fresh login. Passing source tests or seeing startup enabled does not
prove a login or hardware keystroke test.

## Research basis

Decision: keep native macOS desktops, stable app keys, a searchable Alfred menu and
Rectangle layouts. Alternatives are ad-hoc app shortcuts or a new tiling manager
with its own workspace system. The chosen stack preserves existing tools and
DockFlow habits; the trade-off is per-desktop placement rather than atomic recovery
of a full multi-Space session. The illustrated guide includes the evidence and
practical limits. Sources checked September 8, 2026.
