# macOS Hotkeys

Your Hyperland manual. Hold **Caps Lock** for Hyper (Control + Option + Command + Shift); tap it for Escape. Hold **Right Option** for Meh (Control + Option + Shift). Left Option stays normal.

Open **Hyper+/** for the searchable visual guide, or view [the standalone page](hotkeys.html). This reference is generated from the same configuration as the workflows.

## Short workflow menus

| Code | Category | Existing alias |
| --- | --- | --- |
| hk | Hotkeys | hyper |
| fs | Focus Session | focus |
| ss | Session Timer | Direct commands unchanged |
| al | App Launcher | Direct commands unchanged |
| wa | Window Action | Direct commands unchanged |
| wl | Window Layout | layouts |
| cs | Capture | capture |
| st | System Tool | tools |
| dp | DockFlow Profile | Direct commands unchanged |
| gw | Google Workspace | Direct commands unchanged |

Type a code by itself to list its actions, then type a name to filter. Titles use **Category: Name**, for example **Focus Session: Code + Amp**, **Window Layout: Work**, and **DockFlow Profile: Code**. Long menu aliases and direct Google/DockFlow keywords still work. The convention applies to dotfiles-owned workflows; third-party workflows retain their vendor names and configurable keywords.

## Standalone Session timers

Type **ss** in Alfred to list timers. Press Return after selecting one.

| Alfred filter | Timer | Intention |
| --- | --- | --- |
| ss 20 | Pomodoro · 20 minutes | Pomodoro |
| ss 25 | Pomodoro · 25 minutes | Pomodoro |
| ss 30 | 30 minutes | Focus |
| ss 45 | 45 minutes | Focus |
| ss 60 | 1 hour (60 minutes) | Focus |

These start only a Session timer. They do not quit apps, change DockFlow or arrange
windows. Session controls existing-timer prompts, breathing, completion and breaks;
20/25-minute Pomodoro options do not configure an automatic work/break cycle.
Requires an installed Session edition with Pro URL automation.

## Focus sessions

| Alfred command | Session | Minutes | Apps |
| --- | --- | --- | --- |
| fs work | Focus Session: Work | 30 | Microsoft Edge + Microsoft Teams |
| fs amp | Focus Session: Code + Amp | 45 | Zen Browser + Ghostty + Slack + Amp |
| fs claude | Focus Session: Code + Claude | 45 | Zen Browser + Ghostty + Slack + Claude |
| fs cursor | Focus Session: Code + Cursor | 45 | Zen Browser + Ghostty + Slack + Cursor |
| fs t3code | Focus Session: Code + T3 Code | 45 | Zen Browser + Ghostty + Slack + T3 Code |

Work uses Edge on the left two-thirds and Teams on the right third. Code has four variations, using your existing app assignments across **four ordinary macOS desktops**:

- Desktop 1: Zen Browser maximized.
- Desktop 2: the chosen Amp, Claude, Cursor or T3 Code app maximized.
- Desktop 3: Ghostty left two-thirds and Slack right third.

Keep four desktops; use the first three for coding and leave the fourth available. Assign Zen to Desktop 1, the coding app to Desktop 2, and Ghostty + Slack to Desktop 3. On a new Mac create four desktops and restore the Dock → Options → Assign To → This Desktop assignments. Rectangle applies geometry on the assigned desktops; it does not create or reassign Spaces. Native fullscreen is not used.

Focus sessions keep the selected app set and quit all other running regular apps, including unrelated apps such as Slack, Mail and Office. Target apps stay open, including shared Zen Browser/Ghostty/Slack when switching variants. Finder, Alfred, Rectangle Pro, DockFlow, Session and background/menu-bar agents remain available. Save and terminal prompts are respected; a refusal, timeout or app that remains open stops the switch before target launches, layout changes or a timer request. This applies on first use and when reselecting a session.

After app launches and Rectangle layout requests succeed, the workflow sends Session one start request: **Work 30 minutes; every Code variation 45 minutes**. The intention is **Focus Session: Name**. Session must be installed before any app quits; Setapp, direct and App Store editions are supported, and its URL API requires Pro access. Each selection requests a timer, including reselecting the active session. Existing-timer prompts, breathing preparation, pause, completion and breaks remain controlled by Session. Timer delivery is not a countdown acknowledgement. The workflow never automatically retries timer starts, finishes/abandons a timer, or quits your apps when the timer expires. On a new Mac install/activate Session and test its [documented URL API](https://www.stayinsession.com/learn/session-url-scheme); its preferences and history remain outside dotfiles.

The compiled helper and switch lock live in ~/Library/Caches/com.rahulnakmol.hyper, outside Git. Missing target apps stop the switch before any quits. Failed launches can leave a partially opened session; retry. Apple Command Line Tools compile the helper on first use. This switches apps and layouts; it does not change macOS notification Focus modes.

## Launching apps

| Hyper + | App |
| --- | --- |
| D | Zen Browser |
| H | Ghostty |
| F | Finder |
| J | ChatGPT / Codex |
| K | Cursor |
| L | Claude |
| A | Amp (when installed) |
| N | Obsidian |
| E | Microsoft Edge |
| I | Microsoft Teams |
| S | Slack |
| W | Microsoft Word |
| O | Microsoft Excel |
| P | Microsoft PowerPoint |
| R | Safari |
| Z | Final Cut Pro (when installed) |
| X | Motion (when installed) |
| C | Compressor (when installed) |
| T | Telegram (when installed) |
| G | T3 Code |

Each app has one direct shortcut. Final Cut Pro, Motion and Compressor are mapped but not installed by this setup.

## Navigation and Spaces

| Hyper + | Action |
| --- | --- |
| 1…9 / 0 | Switch to Desktop 1…9 / 10 (create it first) |
| Space | Hyper command menu |
| / | Hyper guide |
| Tab | Previous app |
| ` | Next window of this app |
| ↑ / ↓ | Mission Control / app windows |

Hyper+1…9/0 selects existing Desktops 1…10. It does not create them. Hyper+Space opens the menu; Hyper+/ opens this manual. Use Control+Left/Right for neighboring desktops. Run the Mission Control helper during new-Mac setup and log out/in to activate its changes.

## Windows and displays

| Hyper + | Action | Notes |
| --- | --- | --- |
| Return | Maximize | Fill the available desktop; stay out of native fullscreen |
| Backspace | Restore window | Undo the last Rectangle size and position |
| , | Left half | Fit the left half |
| . | Right half | Fit the right half |
| [ | Left third | Fit the left third |
| ] | Centre third | Fit the centre third |
| \ | Right third | Fit the right third |
| ; | Left two-thirds | Fit the left two-thirds |
| ' | Right two-thirds | Fit the right two-thirds |
| − | Move window to previous desktop | Rectangle title-bar drag; requires Control+Left enabled |
| = | Move window to next desktop | Rectangle title-bar drag; requires Control+Right enabled |
| ← | Move window to previous display | Move to the previous connected monitor |
| → | Move window to next display | Move to the next connected monitor |

Maximize fills the current desktop without creating a native fullscreen Space. Layouts size windows; native Dock assignments provide the three-desktop placement. Multiple restored windows and slow app startup may need reapplying a layout from Meh+Return.

## Shared tools with Meh

| Meh + | Action |
| --- | --- |
| A | Universal Actions |
| V | Clipboard history |
| S | Snippets |
| C | CleanShot X capture menu |
| Space | System tools menu |
| Return | Layout chooser |

Universal Actions uses selected text, URLs or files. Clipboard stores text for 24 hours with concealed data and password-app exclusions; images/files are off. Snippet contents stay private. Meh+Up retains Rectangle’s maximize-height shortcut.

## MX Master mouse

| Button | Context | Action |
| --- | --- | --- |
| Back · button4 | Zen Browser, Safari, Edge and Finder | Command+[ · Back |
| Forward · button5 | Zen Browser, Safari, Edge and Finder | Command+] · Forward |
| Hold Forward · button5 | Other apps | Meh · Control+Option+Shift |
| Hold thumb · button6 | All apps | Hyper · Control+Option+Command+Shift |

These mappings target the MX Master 3S Bluetooth device (vendor 1133, product 45108). The desktop counts as Finder, so Forward there navigates rather than supplying Meh. Back retains its normal behavior in other apps. Left, right and middle clicks are unchanged. Hold the modifier button while pressing a keyboard key; thumb + H opens Ghostty. On another Mac, verify the device identifiers in Karabiner-EventViewer before enabling the rule; a receiver or different mouse may report different IDs. Physical button behavior still needs user testing.

## DockFlow profiles

| Meh + | Alfred keyword | Profile |
| --- | --- | --- |
| 0 | ddef | default |
| 1 | dwork | work |
| 2 | dcode | code |
| 3 | dauthor | author |
| 4 | dcreate | create |
| 5 | dvideo | video |
| 9 | dzen | zen |

DockFlow numbers change the Dock profile only. They do not quit apps or switch focus sessions. Focus commands select the Work or Code Dock profile automatically. Transfer DockFlow profiles privately on each Mac; their integration links may need updating.

## Alfred keywords

| Keyword | Action |
| --- | --- |
| hk | Hotkeys menu |
| fs | Focus Session menu |
| ss | Session Timer menu |
| al | App Launcher menu |
| wa | Window Action menu |
| wl | Window Layout menu |
| cs | Capture menu |
| st | System Tool menu |
| dp | DockFlow Profile menu |
| gw | Google Workspace menu |
| hyper | All apps, focus sessions, layouts and window actions |
| fs work | Work: Edge and Teams |
| fs amp | Code: Amp, Ghostty, Slack and Zen Browser |
| fs claude | Code: Claude, Ghostty, Slack and Zen Browser |
| fs cursor | Code: Cursor, Ghostty, Slack and Zen Browser |
| fs t3code | Code: T3 Code, Ghostty, Slack and Zen Browser |
| work / code / zen / default | Layout menus; do not quit apps |
| layouts | All named Rectangle layouts |
| capture | CleanShot X capture menu |
| tools | Audio, timers, keep-awake, activity and settings |
| gdoc | Google Workspace: New Document |
| gsheet | Google Workspace: New Spreadsheet |
| gslides | Google Workspace: New Presentation |
| gform | Google Workspace: New Form |
| gdrive | Google Workspace: Open Drive |

| System tools entry | Alfred query |
| --- | --- |
| Audio output | out  |
| Audio input | in  |
| New timer | timer  |
| Running timers | timers |
| Keep awake — duration and status | cfs  |
| Activity and system tools | atop |
| macOS System Settings | System Settings |
| Alfred Preferences | preferences |

Utility workflows must be installed; the bootstrap checks their IDs. Google Workspace keywords use browser shortcuts, not Google Drive desktop indexing.

## Installed workflow reference

- [1Password](https://alfred.app/workflows/alfredapp/1password/)
- [atop](https://alfred.app/workflows/chrisgrieser/atop/)
- [Audio Switcher](https://alfred.app/workflows/tobiasmende/audio-switcher/)
- [Axe Processes](https://alfred.app/workflows/vitor/axe-processes/)
- [Browser Tabs](https://alfred.app/workflows/epilande/browser-tabs/)
- [Caffeine Dose](https://alfred.app/workflows/vanstrouble/caffeine-dose/)
- [Chromium Bookmarks and History Search](https://alfred.app/workflows/acidham/chromium-bookmarks-and-history-search/)
- [Color Picker](https://alfred.app/workflows/zeitlings/color-picker/)
- [Emoji Mate](https://alfred.app/workflows/fedecalendino/emoji-mate/)
- [GitFred](https://alfred.app/workflows/chrisgrieser/gitfred/)
- [Google Drive](https://alfred.app/workflows/alfredapp/google-drive/)
- [Homebrew](https://alfred.app/workflows/chrisgrieser/homebrew-search/)
- [Network Quality](https://alfred.app/workflows/alfredapp/network-quality/)
- [Safari Control](https://alfred.app/workflows/vanstrouble/safari-control/)
- [Timer](https://alfred.app/workflows/colomolo/timer/)
- [Translate](https://alfred.app/workflows/meshchaninov/translate/)
- [YouTube Suggest](https://alfred.app/workflows/alfredapp/youtube-suggest/)

These links document vendor-specific actions and configurable keywords. Third-party workflow source, credentials and personal settings remain outside Git. The shared Meh tools above provide the stable entry points.

## Capture with CleanShot X

| Capture menu entry | CleanShot command |
| --- | --- |
| All-in-one capture | all-in-one |
| Capture area | capture-area |
| Capture window | capture-window |
| Record screen | record-screen |
| Scrolling capture | scrolling-capture |
| Capture text (OCR) | capture-text |
| Annotate an image file | open-annotate |
| Capture history | open-history |
| CleanShot settings | open-settings |

Meh+C opens the menu without starting a capture. On this Mac, Cmd+Shift+3 captures fullscreen, Cmd+Shift+4 captures an area and Cmd+Shift+5 opens All-in-One. Verify these assignments and enable CleanShot at login on another Mac. The workflow adds no automatic upload. Use the installed Setapp or standalone edition.

## Named layouts

| Layout | Arrangement | Launch closed apps |
| --- | --- | --- |
| Work | Edge left two-thirds; Teams right third | Yes |
| Work Balanced | Edge and Teams in equal halves | Yes |
| Office | Word and Excel in equal halves | Yes |
| Present | PowerPoint maximized | Yes |
| Code | Desktop 1: Zen Browser maximized; Desktop 3: Ghostty left two-thirds, Slack right third | Yes |
| Code Balanced | Desktop 1: Zen Browser maximized; Desktop 3: Ghostty and Slack in equal halves | Yes |
| Terminal | Desktop 3: Ghostty left two-thirds; Slack right third | Yes |
| Agents | Maximize open T3 Code, Claude, Cursor and Amp windows | No |
| Zen | Maximize open Amp, Cursor, Ghostty and Obsidian windows | No |
| Default | Maximize the current app window | No |
| Code Reference | Desktop 1: Zen Browser maximized; Desktop 3: Ghostty left two-thirds, Slack right third | Yes |
| Code Notes | Obsidian left two-thirds; Ghostty right third on the assigned reference desktop | No |
| Code Amp | Desktop 1: Zen Browser maximized; Desktop 3: Ghostty left two-thirds, Slack right third; Desktop 2: Amp maximized | Yes |
| Code Claude | Desktop 1: Zen Browser maximized; Desktop 3: Ghostty left two-thirds, Slack right third; Desktop 2: Claude maximized | Yes |
| Code Cursor | Desktop 1: Zen Browser maximized; Desktop 3: Ghostty left two-thirds, Slack right third; Desktop 2: Cursor maximized | Yes |
| Code T3 Code | Desktop 1: Zen Browser maximized; Desktop 3: Ghostty left two-thirds, Slack right third; Desktop 2: T3 Code maximized | Yes |

Window Layout: Code Amp/Claude/Cursor/T3 Code opens the full corresponding four-app set, selects DockFlow Code and arranges it without quitting other apps or starting a timer. All Code variants use Desktop 1 for Zen Browser maximized, Desktop 2 for the coding app maximized, and Desktop 3 for Ghostty left two-thirds with Slack right third. Amp requires its optional native app. Existing macOS Dock assignments decide which desktop each app opens on; Rectangle only sets geometry.

Code and Code Balanced arrange Zen, Ghostty and Slack. Focus Code uses Code Reference and the selected Code Amp/Claude/Cursor/T3 Code layout. Code Notes remains a separate Obsidian layout. Applying an ordinary layout never quits a focus session.

## Native macOS shortcuts

| Shortcut | Action |
| --- | --- |
| Cmd+Tab / Cmd+` | Switch apps / windows within an app |
| Cmd+W / Cmd+Q | Close window / quit app |
| Cmd+C / Cmd+X / Cmd+V | Copy / cut / paste |
| Cmd+Z / Cmd+Shift+Z | Undo / redo |
| Ctrl+Cmd+F | Native fullscreen, where supported |
| Cmd+Shift+3 / 4 / 5 | Capture keys: use your CleanShot X assignments; verify in CleanShot settings |
| Ctrl+Cmd+Q | Lock screen |
| Fn+C / Fn+N | Control Center / Notification Center |
| Ctrl+Cmd+Space | Emoji and symbols |
| Ctrl+F2 (add Fn if needed) | Navigate menu bar |
| Option+Shift+Volume / Brightness | Fine volume / brightness adjustments |
| Finder: Space / Cmd+Shift+G | Quick Look / Go to Folder |
| Ctrl+Left / Right | Previous / next desktop |
| Cmd+Space | Alfred launcher |

Alfred’s configured launcher is Cmd+Space. Disable Spotlight’s Show Spotlight Search shortcut and clear Raycast’s launcher binding so Alfred is the sole owner of Cmd+Space. Hardware/Fn behavior varies by keyboard. Native Codex shortcuts remain at defaults; Hyper+V is voice chat and Hyper+M dictation while Codex is focused.

## Terminal and editor reference

Ghostty uses its native app shortcuts; this setup adds no global terminal key overrides. Your tmux configuration has its own Ctrl+A prefix and Option+arrow pane navigation. See [tmux source](../tmux/.config/tmux/tmux.conf), [Ghostty source](../ghostty/.config/ghostty/config) and [module documentation](modules/) for their complete local settings. Native app menus remain the source for editor-specific shortcuts.

## New Mac, checks and rollback

Run from the dotfiles clone:

```sh
bash scripts/bootstrap-hyper.sh plan
bash scripts/bootstrap-hyper.sh apply
bash scripts/bootstrap-hyper.sh check
# Undo only the changes recorded by a bootstrap run:
bash scripts/bootstrap-hyper.sh rollback BACKUP_DIRECTORY
```

Follow [the bootstrap guide](modules/hyper-bootstrap.md) for Homebrew, Stow, permissions, licenses, login, vendor workflows and rollback boundaries. Set the per-Mac Dock desktop assignments above. Source tests cannot prove physical keys, native app assignments, a fresh login or behavior on a second Mac. Focus quit/launch behavior is tested with substitutes; a live session switch still requires acceptance with saved work.

## Maintain the manual

Edit scripts/hyper-config.json, then regenerate:

```sh
node scripts/build-hyper-config.mjs
node scripts/render-hyper-guide.mjs
node --test scripts/test-focus-sessions.mjs scripts/test-hyper-bootstrap.mjs scripts/test-hyper-config.mjs scripts/test-launcher-config.mjs scripts/test-codex-policy.mjs scripts/test-mx-master-config.mjs
```

The HTML page, Alfred guide and Markdown reference are generated together. Reimport Rectangle after layout changes. Source is Stow-backed; app licenses, clipboard, snippets and runtime state are not committed.

Structure inspired by [Omarchy’s Hotkeys manual](https://learn.omacom.io/2/the-omarchy-manual/53/hotkeys). Behavior uses [Apple’s normal quit API](https://developer.apple.com/documentation/appkit/nsrunningapplication/terminate()) and [Rectangle’s supported layout API](https://rectangleapp.com/pro/docs/url-api/).

Created by Rahul N Akmol.
