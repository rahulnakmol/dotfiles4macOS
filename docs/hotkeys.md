# macOS Hotkeys

Your Hyperland manual. Hold **Caps Lock** for Hyper (Control + Option + Command + Shift); tap it for Escape. Hold **Right Option** for Meh (Control + Option + Shift). Left Option stays normal.

Open **Hyper+/** for the searchable visual guide, or view [the standalone page](hotkeys.html). This reference is generated from the same configuration as the workflows.

## Focus sessions

| Alfred command | Session | Apps |
| --- | --- | --- |
| focus work | Work | Microsoft Edge + Microsoft Teams |
| focus amp | Code · Amp | Google Chrome + Ghostty + Amp |
| focus claude | Code · Claude | Obsidian + Ghostty + Claude |
| focus cursor | Code · Cursor | Google Chrome + Ghostty + Cursor |
| focus codex | Code · Codex | Google Chrome + Ghostty + ChatGPT / Codex |

Work uses Edge on the left two-thirds and Teams on the right third. Code has exactly four variations, using **two ordinary macOS desktops**:

- Desktop 1: Chrome (Amp/Cursor/Codex) or Obsidian (Claude) on the left two-thirds; Ghostty on the right third.
- Desktop 2: the chosen Amp, Claude, Cursor or Codex app maximized.

On each Mac, create Desktop 1 and Desktop 2 in Mission Control. Visit Desktop 1 and use each app’s Dock icon → Options → Assign To → This Desktop for Chrome, Obsidian and Ghostty. Visit Desktop 2 and assign Amp, Claude, Cursor and Codex there. Assign Edge and Teams to Desktop 1 if Work should use that same desktop. Import the updated Rectangle snapshot. These assignments belong to this Mac; they are not copied as numeric Space IDs. Native fullscreen is not used.

Session commands quit the outgoing session’s apps normally, including shared Ghostty/Chrome on a real variation change. Save or terminal prompts remain interactive. If an app refuses or takes longer than 30 seconds to quit, the next session does not open. Already-quit apps remain closed; retry after resolving the prompt. Apps outside the five configured sets are unaffected. Re-selecting the active session keeps its apps running. On first use, without session history, target apps stay open and other configured-session apps are quit.

The last successful session ID and compiled helper live in ~/Library/Caches/com.rahulnakmol.hyper, outside Git. Missing target apps stop the switch before any quits. Failed launches can leave a partially opened session; retry. Apple Command Line Tools compile the helper on first use. This switches apps and layouts; it does not change macOS notification Focus modes.

## Launching apps

| Hyper + | App |
| --- | --- |
| D | Google Chrome |
| H | Ghostty |
| F | Finder |
| J | ChatGPT / Codex |
| K | Cursor |
| L | Claude |
| A | Amp |
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

Maximize fills the current desktop without creating a native fullscreen Space. Layouts size windows; native Dock assignments provide the two-desktop placement. Multiple restored windows and slow app startup may need reapplying a layout from Meh+Return.

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
| hyper | All apps, focus sessions, layouts and window actions |
| focus work | Work: Edge and Teams |
| focus amp | Code: Amp, Ghostty and Chrome |
| focus claude | Code: Claude, Ghostty and Obsidian |
| focus cursor | Code: Cursor, Ghostty and Chrome |
| focus codex | Code: Codex, Ghostty and Chrome |
| work / code / zen / default | Layout menus; do not quit apps |
| layouts | All named Rectangle layouts |
| capture | CleanShot X capture menu |
| tools | Audio, timers, keep-awake, activity and settings |
| gdoc | undefined |
| gsheet | undefined |
| gslides | undefined |
| gform | undefined |
| gdrive | undefined |

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
| Code | Chrome left two-thirds; Slack right third | Yes |
| Code Balanced | Chrome and Slack in equal halves | Yes |
| Terminal | Ghostty maximized | Yes |
| Agents | Maximize open Codex, Claude, Cursor and Amp windows | No |
| Zen | Maximize open Amp, Cursor, Ghostty and Obsidian windows | No |
| Default | Maximize the current app window | No |
| Code Browser | Chrome left two-thirds; Ghostty right third on Desktop 1 | No |
| Code Notes | Obsidian left two-thirds; Ghostty right third on Desktop 1 | No |
| Code Amp | Amp maximized on Desktop 2 | No |
| Code Claude | Claude maximized on Desktop 2 | No |
| Code Cursor | Cursor maximized on Desktop 2 | No |
| Code Codex | Codex maximized on Desktop 2 | No |

The older Code/Code Balanced communication layouts include Slack. Focus Code uses the separate Code Browser/Code Notes and Code Amp/Claude/Cursor/Codex layouts. Applying an ordinary layout never quits a focus session.

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
node --test scripts/test-focus-sessions.mjs scripts/test-hyper-bootstrap.mjs scripts/test-hyper-config.mjs scripts/test-launcher-config.mjs scripts/test-codex-policy.mjs
```

The HTML page, Alfred guide and Markdown reference are generated together. Reimport Rectangle after layout changes. Source is Stow-backed; app licenses, clipboard, snippets and runtime state are not committed.

Structure inspired by [Omarchy’s Hotkeys manual](https://learn.omacom.io/2/the-omarchy-manual/53/hotkeys). Behavior uses [Apple’s normal quit API](https://developer.apple.com/documentation/appkit/nsrunningapplication/terminate()) and [Rectangle’s supported layout API](https://rectangleapp.com/pro/docs/url-api/).

Created by Rahul N Akmol.
