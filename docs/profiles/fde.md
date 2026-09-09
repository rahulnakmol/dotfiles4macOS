# FDE — Full developer environment

Your keyboard-first macOS manual. Choose FDE for the full environment or TF for Tech Founder. Both use Hyperland, Alfred, Rectangle Pro, DockFlow and Session. Profile selection belongs to this Mac; the shared repository remains identical on every device.

## Start on a new Mac

1. Install Apple Command Line Tools (xcode-select --install), then Homebrew from https://brew.sh. This setup targets Apple Silicon; Amp's native app requires macOS 26 or later.
2. Install Git, Node and Stow, then clone your dotfiles fork into ~/.dotfiles. Do not clone someone else's private credentials or signing files.
3. Preview the selected profile, then apply it. Existing real files or unrelated symlinks are reported as conflicts before any installation. Move your conflicting configuration to a private backup yourself, compare it, and rerun; never use Stow adopt blindly.

```sh
brew install git node stow
cd ~/.dotfiles
bash scripts/setup-workstation.sh plan --profile fde
bash scripts/setup-workstation.sh apply --profile fde
bash scripts/setup-workstation.sh check --profile fde
```

Without --profile, an interactive terminal offers FDE / TF on first use. Later runs use the locally selected profile. Apply installs only missing packages and prints a backup path. Repeat apply after updates; it will refuse to overwrite edits made to managed generated files.

## What is installed

General CLI tools are shared: git, node, stow, zsh, tmux, neovim, eza, bat, fd, ripgrep, fzf, zoxide, starship, curl, jq, gh, podman, zsh-autosuggestions, zsh-syntax-highlighting, zsh-autocomplete, opencode. Shell, prompt, terminal and editor modules are Stow-managed. Homebrew GUI packages: font-jetbrains-mono-nerd-font, alfred, rectangle-pro, dockflow, ghostty, google-chrome, microsoft-edge, microsoft-teams, claude, obsidian, cleanshot, cursor, chatgpt, slack, microsoft-word, microsoft-excel, microsoft-powerpoint, claude-code. Safari and Finder are built into macOS. Licensed media apps are never automatically installed.

FDE keeps all four Code variations and the full app map. Existing Claude/Codex/Cursor/OpenCode configuration modules remain available in the repository; agent trust/auth settings are an explicit personal setup step, not copied to colleagues by this installer.

Git and gh are installed, but personal Git identity, SSH, signing and credential configuration are retained on this Mac and never copied from the repository. Set up your own identity and account separately. No authentication or license information is included in either profile.

## Karabiner: official installer

1. Visit https://karabiner-elements.pqrs.org/ and download the stable DMG suitable for your macOS version. The setup command prints this link when it is missing.
2. Open the DMG, then Karabiner-Elements.pkg. Complete macOS Installer and enter administrator credentials directly.
3. Launch Karabiner-Elements. Complete the background-service, driver extension and input/accessibility prompts shown by that version. Choose the physical keyboard type (ANSI / ISO / JIS).
4. Select Hyperland. Hold Caps Lock and press F: Finder should open. Tap Caps Lock: Escape should be sent. Hold Right Option and press Return: Alfred's layouts should appear.
5. Restart or log out when prompted, then repeat the physical tests. An app icon or old Homebrew receipt is not proof that the driver works.

Karabiner is deliberately excluded from Homebrew installation. An existing healthy install is retained; a broken Homebrew install needs the vendor's uninstall/reinstall guidance rather than deleting driver files. The entire ~/.config/karabiner directory is linked, so Karabiner can observe changes; its JSON file alone must not be symlinked.

## Complete the apps on each Mac

1. Alfred: activate Powerpack; Advanced → Set preferences folder → ~/.config/alfred. Restart Alfred. Rerun apply to set this machine's Command+Space launcher and Meh feature keys. Disable Spotlight's Command+Space and any Raycast launcher/Hyper bindings that overlap.
2. Rectangle Pro: activate, grant Accessibility, enable login, then App Settings → Import Config → ~/.config/rectangle-pro/RectangleProConfig.json. Repeat this import after changing profiles or updating layouts; Stow alone does not apply native Rectangle settings.
3. Session: install the focus timer from https://www.stayinsession.com/ or Setapp. Activate Pro URL automation, enable login and review breathing/break settings. Do not install the Homebrew session cask: it is an unrelated messenger.
4. Amp: install the native Mac app from https://ampcode.com/app. The CLI alone does not satisfy the Amp window layout. Sign in directly in the app.
5. DockFlow: activate, enable login, and import the preset pack described below. Leave its automatic app quit/launch actions off; Alfred owns focus orchestration and Rectangle owns window geometry.
6. CleanShot X: an existing Setapp copy is accepted. Otherwise install/activate the standalone app. Enable login, grant capture permission, and configure Command+Shift+3/4/5 in CleanShot. Approve its external-command prompt when you first use the capture menu.
7. Install the utility workflows from Alfred Gallery using the links below. Keep their default keywords. Their credentials, settings, snippets and history stay local.

| Workflow | Install from |
| --- | --- |
| atop | https://alfred.app/workflows/chrisgrieser/atop/ |
| Audio Switcher | https://alfred.app/workflows/tobiasmende/audio-switcher/ |
| Caffeine Dose | https://alfred.app/workflows/vanstrouble/caffeine-dose/ |
| Timer | https://alfred.app/workflows/colomolo/timer/ |

Owned Hyper, DockFlow Profiles and Google Workspace workflows are generated automatically, with author Rahul N Akmol and icons. Third-party workflows keep their own authors and names. Their existing installations are retained in that profile's private preferences bundle.

## Four desktops and two working Spaces

Create four desktops in Mission Control. Then run the existing helper:

```sh
bash scripts/setup-hyper-macos.sh plan
bash scripts/setup-hyper-macos.sh apply
bash scripts/setup-hyper-macos.sh check
```

Log out and back in after changing Mission Control settings. In each app's Dock icon → Options → Assign To → This Desktop, assign Chrome, Obsidian, Ghostty, Edge and Teams to Desktop 1; Amp, Claude, Cursor and Codex to Desktop 2. Use Desktops 3 and 4 for other tasks. Existing assignments are respected, never recreated by window-title matching. Native fullscreen creates separate Spaces; these workflows use maximized and tiled ordinary windows.

Code arrangement:

```text
Desktop 1: [ Chrome / Obsidian  2/3 ][ Ghostty 1/3 ]
Desktop 2: [ chosen coding app maximized                  ]
Desktop 3 and 4: available for other tasks
```

Work uses Edge 2/3 + Teams 1/3. Code + Claude uses Obsidian in place of Chrome. All other Code variants use Chrome.

On small displays Teams may refuse a narrow third. Choose Work Balanced or use Hyper+Return to maximize. Extra app windows may need manual placement. Exact native fullscreen Split View recreation is not part of this setup.

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
| fs work | Focus Session: Work | Microsoft Edge + Microsoft Teams | 30 |
| fs amp | Focus Session: Code + Amp | Google Chrome + Ghostty + Amp | 45 |
| fs claude | Focus Session: Code + Claude | Obsidian + Ghostty + Claude | 45 |
| fs cursor | Focus Session: Code + Cursor | Google Chrome + Ghostty + Cursor | 45 |
| fs codex | Focus Session: Code + Codex | Google Chrome + Ghostty + ChatGPT / Codex | 45 |

Type fs, select a session, and press Return. All unrelated regular GUI apps are asked to quit, including Slack, Mail or an editor outside that session. Target apps stay open. Finder, Alfred, Rectangle Pro, DockFlow, Session and background/menu-bar services remain available. Save and terminal prompts are respected; there is no force quit. If an app refuses, already-closed apps stay closed and the switch stops before starting the next timer. A missing target app, Session or named DockFlow preset stops before any quits.

Timer delivery is requested once. Session controls existing-timer prompts, breathing, breaks and completion. Apps do not close at expiry. Focus does not continuously prevent opening other apps. Test fs only after saving work; use wl for everyday arrangement without closing distractions.

## Window layouts

| Alfred wl result | Arrangement |
| --- | --- |
| Work | Edge left two-thirds; Teams right third |
| Work Balanced | Edge and Teams in equal halves |
| Office | Word and Excel in equal halves |
| Present | PowerPoint maximized |
| Code | Chrome left two-thirds; Slack right third |
| Code Balanced | Chrome and Slack in equal halves |
| Terminal | Ghostty maximized |
| Agents | Maximize open Codex, Claude, Cursor and Amp windows |
| Zen | Maximize open Amp, Cursor, Ghostty and Obsidian windows |
| Default | Maximize the current app window |
| Code Browser | Chrome left two-thirds; Ghostty right third on the assigned reference desktop |
| Code Notes | Obsidian left two-thirds; Ghostty right third on the assigned reference desktop |
| Code Amp | Google Chrome left two-thirds; Ghostty right third on the assigned reference desktop; Amp maximized on the assigned coding desktop |
| Code Claude | Obsidian left two-thirds; Ghostty right third on the assigned reference desktop; Claude maximized on the assigned coding desktop |
| Code Cursor | Google Chrome left two-thirds; Ghostty right third on the assigned reference desktop; Cursor maximized on the assigned coding desktop |
| Code Codex | Google Chrome left two-thirds; Ghostty right third on the assigned reference desktop; ChatGPT / Codex maximized on the assigned coding desktop |

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

Hold Caps Lock for Hyper (Control+Option+Command+Shift); tap for Escape. Hold Right Option for Meh (Control+Option+Shift). Left Option remains Option. Shared app keys never change when switching FDE and TF.

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
| Z | Final Cut Pro |
| X | Motion |
| C | Compressor |

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

Hyper+Space opens hk; Hyper+/ opens this guide. Hyper+1…9/0 navigates existing desktops; it does not create them. Codex retains its defaults; Hyper+V voice and Hyper+M dictation are supplied by its separate existing keybindings module.

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
| 3 | 3. Author | dauthor |
| 4 | 4. Create | dcreate |
| 5 | 5. Video | dvideo |
| 9 | 9. Zen | dzen |

Optional MX Master 3S Bluetooth rules remain scoped to vendor 1133/product 45108. Back/Forward navigate in Chrome, Edge, Safari and Finder; hold Forward elsewhere for Meh, and hold thumb button6 for Hyper. Verify identifiers in EventViewer for another mouse/receiver. Keyboard navigation does not require that mouse.

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

## Import and export DockFlow

1. In DockFlow → Settings → Backup & Restore → Export Backup, export your existing presets privately before importing anything. Leave Include folders off for shared packs.
2. Import ~/.dotfiles/dockflow/presets/fde.json. Select the presets for this setup. Imports add presets; they do not replace existing ones automatically.
3. Ensure exactly one preset has each name in the table above. If you already have a same-named preset, rename the old one (for example Saved Work) before importing. Do not repeatedly import the same pack.
4. Verify apps were resolved on this Mac, and app-opening/quitting actions remain off. The export packs contain no private folders, browser profiles, account data or custom launch actions.
5. Test dp work and dp code. Name-based selection discovers the current preset rather than reusing another Mac's IDs. Duplicate/missing names produce an actionable error.
6. To share later edits, export selected presets without folders to a private temporary location. Use scripts/sanitize-dockflow.mjs to create a sanitized export, review the diff, then commit the pack. Never Stow DockFlow's live database.

FDE has seven presets; TF has Default, Work, Code and Zen only. Switching an existing FDE Mac to TF hides extra presets in Alfred but leaves the saved DockFlow library intact. Rename/archive old presets manually if desired. Export JSON uses DockFlow's native schema, not a made-up format.

## Updates, profile switching and rollback

After pulling reviewed changes, rerun plan, apply and check with the same profile. Profile-generated source lives under ~/.local/share/dotfiles/workstations/fde; ~/.config links are managed by GNU Stow. Source definitions, exports and this documentation are versioned in dotfiles. Histories, local preferences and generated activation journals stay on this Mac.

To switch, run apply --profile tf. Only links owned by this checkout or its managed profile folders may be replaced. Other files cause a conflict. Each profile keeps its own Alfred preferences and third-party workflows; switching back restores access to its previous preferences. On the first migration from the legacy dotfiles Alfred folder, that folder remains intact; select/install the needed utility workflows in the new profile. No private workflow variables or histories are copied automatically.

After switching, reconnect Alfred to ~/.config/alfred and restart it, import the new Rectangle snapshot and chosen DockFlow pack, then run check. Check reports machine-local steps as unverified until physically tested; it never equates file correctness with permissions or a login test.

```sh
bash scripts/setup-workstation.sh rollback BACKUP_DIRECTORY
```

Rollback restores managed files, links, profile selection and narrowly managed Alfred fields for that run. It retains installed applications and personal data. Later edits cause rollback to stop rather than overwrite them. Restore Rectangle from its previous native export and DockFlow from your private backup separately; OS permissions, accounts and licenses are not reversed. Mission Control has its own backup/rollback command.

## Verification and troubleshooting

1. check must report no file/link drift, missing packages, required apps or preset names. Complete any remaining guided requirements.
2. Test physical Caps Lock, Right Option, application launch keys, the four desktop shortcuts, and Meh numbers.
3. Test wl work and wl Code Amp; windows should land on their assigned desktops. If they land elsewhere, repair native Dock assignments and ensure automatic Space rearrangement is disabled.
4. With work saved, test fs work (30 minutes) and fs amp (45). Resolve prompts; verify the countdown in Session. Check unrelated apps closed and support tools stayed open.
5. Verify Alfred, Rectangle, DockFlow, Session and CleanShot after a logout/login. Repeat on Air and Pro, and with an external display. Report physical checks separately from automated tests.

Missing Alfred menus: select the right preferences folder and restart. Missing utility: install its Gallery workflow. Missing layout: reimport Rectangle snapshot. Wrong Dock: inspect duplicate preset names. No Hyper: complete Karabiner services/driver permissions and check the selected profile. Timer absent: verify the correct Session app and Pro automation. There is no automated license activation.
