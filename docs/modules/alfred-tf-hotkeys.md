# Alfred TF hotkeys

Use this reference with the **TF Alfred profile**. For installation, see the [Alfred guide](../guides/alfred.md) or [TF profile guide](../guides/profiles/tf.md). For Raycast, use its [own shortcuts](raycast-hotkeys.md).

## Choose the right command

| Command | Effect |
| --- | --- |
| fs | Focus Session: quits other regular apps, opens the chosen set, switches DockFlow, arranges windows, requests a Session timer |
| wl | Window Layout: opens and arranges the chosen set and switches DockFlow; leaves other apps open; no timer |
| dp | DockFlow Profile: changes the Dock only |
| ss | Session Timer: starts a timer only |
| hk | Hotkeys: all enabled apps, layouts, focus sessions and guide |
| al | App Launcher |
| wa | Window Action |
| cs | CleanShot capture menu |
| st | System tools and keep-awake |
| gw | Google Workspace browser shortcuts |

## Focus sessions

| Command | Session | Apps | Minutes |
| --- | --- | --- | --- |
| fs work | Focus Session: Work | Microsoft Edge + Microsoft Teams + Claude | 30 |
| fs code | Focus Session: Code + Cursor | Zen Browser + Ghostty + Slack + Cursor | 45 |
| fs innovate | Focus Session: Innovate + Codex | Zen Browser + Ghostty + Slack + ChatGPT / Codex | 45 |

Type fs, select a session, and press Return. All unrelated regular GUI apps are asked to quit, including Slack, Mail or an editor outside that session. Target apps stay open. Finder, Alfred, Rectangle Pro, DockFlow, Session and background/menu-bar services remain available. Save and terminal prompts are respected; there is no force quit. If an app refuses, already-closed apps stay closed and the switch stops before starting the next timer. A missing target app, Session or named DockFlow preset stops before any quits.

Timer delivery is requested once. Session controls existing-timer prompts, breathing, breaks and completion. Apps do not close at expiry. Focus does not continuously prevent opening other apps. Test fs only after saving work; use wl for everyday arrangement without closing distractions.

## Window layouts

| Alfred wl result | Arrangement |
| --- | --- |
| Work | Edge left two-thirds; Teams right third; Claude Desktop maximized on the assigned agent desktop |
| Work Balanced | Edge and Teams in equal halves; Claude Desktop maximized on the assigned agent desktop |
| Default | Maximize the current app window |
| Code Reference | Desktop 1: Zen maximized; Desktop 3: Ghostty left two-thirds, Slack right third |
| Code | Desktop 1: Zen maximized; Desktop 3: Ghostty left two-thirds, Slack right third; Desktop 2: Cursor maximized |
| Innovate | Desktop 1: Zen maximized; Desktop 3: Ghostty left two-thirds, Slack right third; Desktop 2: Codex maximized |
| Terminal | Ghostty left two-thirds; Slack right third on Desktop 3 |
| Zen | Obsidian left two-thirds; Claude Desktop maximized on its assigned desktop |

## Timers and keep-awake

| Command | Duration |
| --- | --- |
| ss 20 | Pomodoro · 20 minutes |
| ss 25 | Pomodoro · 25 minutes |
| ss 30 | 30 minutes |
| ss 45 | 45 minutes |
| ss 60 | 1 hour (60 minutes) |

Choose ss 20 or ss 25 for a Pomodoro timer. These are single sessions; they do not reconfigure Session's automatic breaks. Caffeine Dose uses macOS caffeinate: caff toggles, cfs 45 keeps awake 45 minutes, cfs s checks status, cfs d stops. No separate Caffeine app is required. Keep-awake is independent of the focus timer.

## Hyper and Meh

Hold Caps Lock for Hyper (Control+Option+Command+Shift); tap for Escape. Hold Right Option for Meh (Control+Option+Shift). Left Option remains Option. Shared app keys never change when switching FDE and TF. Hyper+D opens the browser: Zen Browser in both FDE and TF.

| Hyper + | App |
| --- | --- |
| D | Zen Browser |
| H | Ghostty |
| F | Finder |
| J | ChatGPT / Codex |
| K | Cursor |
| L | Claude |
| N | Obsidian |
| E | Microsoft Edge |
| I | Microsoft Teams |
| S | Slack |
| R | Safari |

| Hyper + | Window action |
| --- | --- |
| Return | Maximize |
| Backspace | Restore window |
| , | Left half |
| . | Right half |
| [ | Left third |
| ] | Centre third |
| \ | Right third |
| ; | Left two-thirds |
| ' | Right two-thirds |
| − | Move window to previous desktop |
| = | Move window to next desktop |
| ← | Move window to previous display |
| → | Move window to next display |

| Hyper + | Navigation |
| --- | --- |
| 1…9 / 0 | Switch to Desktop 1…9 / 10 (create it first) |
| Space | Hyper command menu |
| / | Hyper guide |
| Tab | Previous app |
| ` | Next window of this app |
| ↑ / ↓ | Mission Control / app windows |

Hyper+Space opens hk; Hyper+/ opens this guide. Hyper+1…9/0 navigates existing desktops; it does not create them. Codex retains its defaults; Hyper+V voice, Hyper+M dictation and Hyper+B toggle pet (buddy) are supplied by its separate keybindings module. The pet shortcut toggles visibility globally while Codex runs. Codex supports one global pet binding, so Hyper+B replaces Option+Space. Profile setup does not Stow personal Codex settings: configure Show pet as Hyper+B in Codex keyboard settings, or use your reviewed keybindings module.

| Meh + | Action |
| --- | --- |
| A | Universal Actions |
| V | Clipboard history |
| S | Snippets |
| C | CleanShot X capture menu |
| Space | System tools menu |
| Return | Layout chooser |

| Meh + | DockFlow | Keyword |
| --- | --- | --- |
| 0 | 0. Default | ddef |
| 1 | 1. Work | dwork |
| 2 | 2. Code | dcode |
| 3 | 3. Innovate | dinnovate |
| 9 | 9. Zen | dzen |

Optional MX Master 3S Bluetooth rules remain scoped to vendor 1133/product 45108. Back/Forward navigate in Zen Browser and optional Chrome Canary, Edge, Safari and Finder; hold Forward elsewhere for Meh, and hold thumb button6 for Hyper. Verify identifiers in EventViewer for another mouse/receiver. Keyboard navigation does not require that mouse.

## Native shortcuts and Google Workspace

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

Command+Space belongs to Alfred. Capture shortcuts belong to CleanShot. Command+C/V/X/Z, Command+Tab and other native editing/app commands remain familiar. Use gw to list New Document, New Spreadsheet, New Presentation, New Form and Open Drive. Existing gdoc, gsheet, gslides, gform and gdrive browser shortcuts remain available; Google Drive for desktop is not required.

