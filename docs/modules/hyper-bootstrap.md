# Hyper setup on a new Mac

The native macOS layer keeps editing and app commands familiar. Caps Lock supplies
Hyper for the approved app/window map. Right Option supplies Meh for shared actions
and DockFlow numbers. CleanShot X is the capture tool, including Setapp installations.

## Six shared actions

| Meh + | Action | Owner |
| --- | --- | --- |
| A | Act on selected text, URL or file | Alfred Universal Actions |
| V | Search clipboard history | Alfred Clipboard |
| S | Search snippets | Alfred Snippets |
| C | Choose a CleanShot capture tool | Hyper workflow |
| Space | Audio, timers, keep-awake, activity and settings | Hyper workflow |
| Return | Choose a saved window layout | Hyper workflow |

Keywords `capture`, `tools` and `layouts` open the same workflow menus. The system
menu uses vendor defaults (`out`, `in`, `timer`, `timers`, `cfs`, `atop`); update
`systemTools` in `scripts/hyper-config.json` if you customize those keywords.

Clipboard history keeps plain text for 24 hours. Images and file lists are off.
Concealed content remains excluded; the bootstrap preserves the existing app
blacklist, including any additional exclusions you added. Alfred's built-in
password-app blacklist applies when no custom blacklist exists. Snippet search
works without enabling automatic expansion; bootstrap leaves that preference alone.
Clipboard history, snippet contents and workflow variables are never put in Git.

Meh+C opens a menu before taking action. CleanShot handles all-in-one capture,
area/window capture, recording, scrolling capture, OCR, annotation and history.
The workflow does not request an upload or rewrite your capture hotkeys. CleanShot
can ask for permission to accept external URL commands on first use; approve that
in its own prompt. Verify your Cmd+Shift+3/4/5 assignments in CleanShot settings.

Local checkpoint, September 8, 2026: bootstrap `check` passes on this MacBook Air;
all 39 automated checks pass. Alfred’s layout menu and system-tools handoff were
verified live. CleanShot accepted the approved external command and opened its
settings; its Cmd+Shift+3/4/5 capture bindings and Launch at login were verified.
Physical Meh keys, a fresh login and the second Mac still need testing. CleanShot’s
login toggle is a per-Mac guided setting, outside the bootstrap rollback journal.

## First installation

1. Install Homebrew from https://brew.sh and its required Apple command-line tools.
2. Install Git, clone this dotfiles repository, and enter the clone.
3. Run the commands below. `plan` and `check` never install anything. If Node is
   missing, `apply` can install it through an existing Homebrew installation;
   for an initial read-only plan, install Node yourself first.

```sh
brew install git node stow
# Clone your dotfiles remote, then:
cd ~/.dotfiles
bash scripts/bootstrap-hyper.sh plan
bash scripts/bootstrap-hyper.sh apply
bash scripts/bootstrap-hyper.sh check
```

`apply` installs missing Stow, Alfred and Rectangle Pro through Homebrew.
Install Karabiner separately from https://karabiner-elements.pqrs.org/: open the
DMG, run Karabiner-Elements.pkg, and complete its services and input permissions.
It does not install every mapped app, CleanShot, or licensed media apps. Install
CleanShot through your existing Setapp subscription or your standalone license;
a Setapp installation already satisfies the check, so there is no duplicate cask.

The bootstrap applies narrow Alfred feature preferences and runs GNU Stow for
`alfred`, `karabiner`, and `rectangle-pro`. It never adopts existing directories.
A conflicting directory or different symlink stops apply so you can merge it
first. The `.config` parent remains a real directory, allowing Karabiner's required
directory symlink and live reload.

Alfred's `~/Library/Application Support/Alfred/prefs.json` supplies the local machine
hash and active preferences location. The bootstrap does not copy another Mac's
local folder or read history databases. If Alfred has not initialized, shared
settings are prepared and `check` reports the local setup as pending. Launch Alfred,
select this clone's `alfred/.config/alfred` preferences folder in Advanced, restart
Alfred, and rerun `apply`. `--local-id HASH` is an explicit recovery option only
when you have verified the current machine's ID.

The [complete hotkeys manual](../hotkeys.md) also covers Work and all four Code
focus variations. Import the updated Rectangle snapshot and make its native Dock
assignments on each Mac for the two coding desktops. The focus helper compiles
using Apple Command Line Tools; first-use compilation and live quitting are not
part of bootstrap apply. Only normal application quits are requested.

## Guided steps on each Mac

The command cannot grant permissions or activate licenses for you. Complete these
steps and test the resulting system; a successful file check is not a login test.

| Step | Completion |
| --- | --- |
| Alfred | Activate Powerpack, select the Stow-backed preferences folder, enable login, and restart after preference-file changes |
| Karabiner | Complete driver/input permissions, select Hyperland, and verify ANSI/ISO/JIS keyboard type matches your hardware |
| Rectangle Pro | Activate, enable login, grant Accessibility, and import `~/.config/rectangle-pro/RectangleProConfig.json` |
| CleanShot X | Activate through Setapp or standalone license, enable login, grant capture permissions, approve external-command prompt, verify capture shortcuts |
| Utility workflows | Restore missing workflows from the official Gallery links below; keep defaults or update the system-menu queries |
| DockFlow | Transfer presets through its private backup/import flow, verify integration URLs and enable login |
| macOS Spaces | Create desktops, run `bash scripts/setup-hyper-macos.sh plan` then `apply` and `check`; log out and back in |
| Launcher ownership | Alfred owns Cmd+Space. Disable Show Spotlight Search under macOS Keyboard Shortcuts → Spotlight, and clear Raycast's launcher shortcut if present |

The utility catalog is `docs/alfred-workflows.json`. Third-party workflows are
installed through Alfred's Gallery importer; their source and variables stay ignored.
The bootstrap reports missing bundle IDs and leaves installation as a guided step:

- [Audio Switcher](https://alfred.app/workflows/tobiasmende/audio-switcher/): output/input picker.
- [Timer](https://alfred.app/workflows/colomolo/timer/): timer creation/list.
- [Caffeine Dose](https://alfred.app/workflows/vanstrouble/caffeine-dose/): sleep prevention, duration and status.
- [atop](https://alfred.app/workflows/chrisgrieser/atop/): activity and system menus.

The three owned workflows are tracked and available immediately after Stow. The
utility catalog records installation sources; it is not a bundled installer or a
backup of vendor settings.

## Check and rollback

`check` validates generated source, expected symlinks, exact managed Alfred fields,
Alfred's active preferences location, core app presence, CleanShot presence and the
four utility workflow bundle IDs. A missing requirement returns a nonzero status.
Permissions, license state, native Rectangle import, desktop activation, workflow
keyword customizations and login behavior require the guided/physical checks above.

Every `apply` prints its backup directory and exact rollback command:

```sh
bash scripts/bootstrap-hyper.sh rollback ~/.local/state/dotfiles/backups/hyper-bootstrap-TIMESTAMP
```

Rollback restores only fields changed by that run and removes only symlinks that
run created. It preserves unrelated preferences, personal data, installed packages,
existing links and all source files. Empty preference files/directories can remain.
A later edit to a managed field or replaced link stops rollback before it changes
anything. Dangling Stow links are reported as conflicts; redirected preference paths
are refused before their contents are read or changed. Do not bypass that check: compare the journal and current setting first.
Repeated apply/rollback is safe; rolling back a no-op run does not undo an older run.

The journal contains only managed preference values and link paths, not complete
application preference dumps. Repository changes are reviewed separately with Git;
bootstrap rollback is not a Git reset. The earlier Mission Control helper has its
own backup and rollback instructions in [hyper.md](hyper.md).

## Maintain and verify

```sh
node scripts/build-hyper-config.mjs
node scripts/render-hyper-guide.mjs
node --test scripts/test-focus-sessions.mjs scripts/test-hyper-bootstrap.mjs scripts/test-hyper-config.mjs scripts/test-launcher-config.mjs scripts/test-codex-policy.mjs
bash scripts/bootstrap-hyper.sh check
```

Test Meh+A with non-sensitive selected text; V with a disposable copied phrase;
S opens Snippets (an empty collection is valid); C opens the capture menu; Space
opens System Tools; Return opens Layouts. Selecting Audio output must show devices
without changing one until you choose it. Test physical Right Option, Caps Lock,
Meh DockFlow numbers, native app shortcuts, window geometry and another login.
Repeat on the second Mac and an external display before claiming device parity.

References: [Alfred sync exclusions](https://www.alfredapp.com/help/advanced/sync/),
[Universal Actions](https://www.alfredapp.com/help/features/universal-actions/),
[Clipboard](https://www.alfredapp.com/help/features/clipboard/),
[Show Alfred utility](https://www.alfredapp.com/help/workflows/utilities/show-alfred/),
[Apple keyboard shortcuts](https://support.apple.com/en-us/102650),
[CleanShot URL API](https://cleanshot.com/docs-api).

## Session timer prerequisite

Timed `fs` commands require Session (Setapp, direct or App Store edition) with
Pro URL automation. Install and activate it on each Mac; this bootstrap does not
install a duplicate copy or migrate its account, preferences or history. The focus
helper checks availability before quitting apps. Work requests 30 minutes; every
Code variation requests 45 minutes after the layouts. Verify the timer visibly
starts and review Session’s existing breathing, completion and break settings.
Launch at login was already enabled on this Mac; verify it on your other Mac.
