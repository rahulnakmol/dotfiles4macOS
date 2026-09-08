# Alfred migration on macOS

Status: migration in progress, September 7, 2026. Alfred 5.7.3 is installed through
Homebrew. Its preferences location is `~/.dotfiles/alfred/.config/alfred`, also
reachable through the Stow directory link `~/.config/alfred`. Raycast remains
available while replacement commands are built and tested. Nothing here asserts
complete plugin parity.

Rectangle Pro 3.90 is now installed, with launch at login enabled. Its five Hyper
bindings are imported and verified in Preferences. Karabiner is installed and
supplies Hyperkey from its active Stow-managed profile. Raycast's Hyper Key is set
to None. DockFlow profile shortcuts now run directly through Alfred; Raycast
remains available while the remaining plugin migration is unfinished.

## Window layouts and login

The agreed setup is Alfred + Karabiner + Rectangle Pro, with macOS retaining drag
snapping. Rectangle Pro's own drag snapping is disabled. Alfred's launch-at-login
checkbox and Rectangle Pro's launch-on-login switch are both enabled. Alfred's
General page reports Option+Space as its main hotkey; Raycast retains Command+Space
during this transition.
macOS's login-item registry also reports both Alfred and Rectangle Pro as enabled
and allowed (`sfltool dumpbtm`, checked September 7, 2026).
Karabiner's Setup page confirms background services, Accessibility, input capture,
and the driver extension are allowed. Its registered console-user service, core
service, and virtual HID daemon are running. No separate login item is required
for the Karabiner Settings window.

| Shortcut | Rectangle action |
| --- | --- |
| Hyper + [ | First (left) third |
| Hyper + ] | Centre third |
| Hyper + backslash | Last (right) third |
| Hyper + ; | First (left) two-thirds |
| Hyper + ' | Last (right) two-thirds |
| Hyper + Left / Right arrow | Move window to previous / next display |

Hyper is Control+Option+Command+Shift (held Caps Lock). Hyper numbers select
macOS desktops. Meh is Control+Option+Shift (Right Option); Meh numbers select
DockFlow profiles in Alfred. The matching Raycast quicklink hotkeys have been
cleared to prevent duplicate handlers. Other existing Rectangle shortcuts remain.

```sh
brew install --cask alfred rectangle-pro karabiner-elements
stow alfred rectangle-pro
```

In Rectangle Pro > App Settings > Import Config, select
`~/.config/rectangle-pro/RectangleProConfig.json`. This Stow-managed file is a
reviewable import snapshot, not the app's live preferences file. Reimport after
editing it. The native format requires `bundleId`, `version`, `timestamp`,
`defaults`, and `shortcuts`; omitting the timestamp caused a silent failed import
in 3.90. The snapshot contains shortcuts, startup/drag-snapping defaults and reviewed
app layouts; it does not include activation data or window titles. Enter the Rectangle Pro license directly in the app.

The five bindings were checked both in the running Preferences UI and through
individual defaults keys after successful import. After the Karabiner cutover on
September 7, the user confirmed that physical Caps Lock + U/I/O and Left/Right,
tap Caps Lock for Escape, and the original DockFlow number shortcuts all work.
The later Meh and window-key reassignment still needs physical confirmation. A fresh login
has not been tested; enabled startup settings alone do not verify a fresh login.

## Reusable configuration

```sh
brew install --cask alfred
cd ~/.dotfiles
stow -n -v alfred
stow alfred
```

Activate your existing Powerpack directly in Alfred on each Mac. In Advanced >
Set preferences folder, choose `~/.config/alfred`, then use the existing bundle
and restart Alfred. If a machine already has Alfred settings, back them up and
review conflicts first; choosing this bundle replaces the active settings source.
Never use `stow --adopt` to absorb an existing installation.

The actual bundle is
`alfred/.config/alfred/Alfred.alfredpreferences/`. Git includes the
owned Google Workspace, DockFlow and Hyper workflows' `info.plist` and `icon.png` files.
All owned workflows use `Rahul N Akmol` as Created By. All other bundle contents are
ignored by default, including third-party workflows and their variables, local
settings, snippets, and subsequently created preferences. Add individual settings
to the allowlist only after reviewing them. This is a working preferences location
with selected reusable source, **not a complete tracked Alfred configuration**.
License files, databases, and workflow data outside the bundle remain local.

Alfred saves workflows created or installed through its UI under this preferences
bundle too. Physical storage in dotfiles does not mean Git includes every file:
new workflow folders stay ignored until their source is reviewed and individually
allowlisted. The owned workflows are allowlisted; their local changes still
require a commit and push to reach the remote repository.

Both owned workflows include a formatted usage guide in the `readme` field of
their `info.plist`. Read it in Alfred Preferences > Workflows > select the workflow
> Configure Workflow. Each guide covers commands, examples, setup, customisation,
troubleshooting, and storage; DockFlow also covers transferring presets to another
Mac. Edit it with the workflow's Prepare workflow configuration and variables
button. Documentation is saved alongside the workflow, not in a separate runtime
location. Configuration tests check that each keyword is documented.

Alfred does not sync some machine settings, including the main hotkey, selected
theme, search scope, clipboard-history enablement, snippet expansion, and browser
bookmark sources. Set these on each Mac. See [Alfred's sync documentation](https://www.alfredapp.com/help/advanced/sync/).

The included workflow uses native keyword and Open URL objects:

| Keyword | Action when you press Return |
| --- | --- |
| `gdoc` | Create a Google document |
| `gsheet` | Create a Google spreadsheet |
| `gslides` | Create a Google presentation |
| `gform` | Create a Google form |
| `gdrive` | Open Google Drive |

These use your default browser and its account selection. No OAuth app or token is
configured. The [.new shortcuts are provided by Google](https://workspaceupdates.googleblog.com/2019/10/google-dot-new.html).
All five keyword results were visually verified in the running Alfred launcher.
Powerpack workflows are operational on this Mac; activation does not need to be
repeated here.
Creating a real document is a manual acceptance check; automated checks do not
create cloud files. Search results inside Alfred and a starred-files menu bar are
still missing.

## DockFlow profiles in Alfred

The owned `user.workflow.dockflow-profiles` workflow uses native keywords and
Hotkey triggers connected to Open URL actions. Links were copied directly from
DockFlow Settings > Integrations on September 7, 2026. No script or Raycast
dependency is involved. DockFlow itself remains installed and enabled at login.

| Keyword | Meh key (Right Option) | Existing DockFlow preset |
| --- | --- | --- |
| `ddef` | 0 | 0. Default |
| `dwork` | 1 | 1. Work |
| `dcode` | 2 | 2. Code |
| `dauthor` | 3 | 3. Author |
| `dcreate` | 4 | 4. Create |
| `dvideo` | 5 | 5. Video |
| `dzen` | 9 | 9. Zen |

Before the Meh migration, the user confirmed `dcode` and physical Hyper+1 / Hyper+2 worked through Alfred
after all seven matching Raycast hotkeys were cleared. Raycast quicklinks remain
available without hotkeys for rollback. The source tests verify all seven keyword
and hotkey pairs lead to their corresponding copied integration URL.

This imports profile launchers into Alfred. Layouts and preset contents remain
managed by DockFlow, not by Stow. On another Mac, use DockFlow Settings > Backup &
Restore to transfer presets privately, then compare each Integrations link with
the workflow's Open URL action. Update URLs if import assigns new preset UUIDs.
Do not Stow DockFlow's live SQLite database or assume UUIDs are identical across
devices. Avoid enabling the same number hotkeys in both launchers.

Icons identify the target apps; they do not imply vendor authorship. DockFlow's
256px PNG was extracted from the installed app's `AppIcon.icns`; the Google icon
comes from [Google's branding assets](https://www.gstatic.com/images/branding/googleg/2x/googleg_standard_color_128dp.png).
Brand assets remain their respective owners' property.

## Installed Raycast plugins and replacement coverage

The inventory comes from all 23 installed extension manifests, with Linear also
checked in Raycast's UI. [The full command list](../raycast-extensions.json) records
declarations only: installed does not prove daily usage, enablement, or account
connectivity. The UI additionally exposed Linear's Ask Linear command. No account
settings or credentials were exported.

Fourteen Gallery workflows were installed on September 7, 2026, alongside the
existing Caffeine Dose, atop, and Safari Control workflows. Alfred recognizes all
17 as Gallery workflows, plus the two owned workflows. Installation is recorded
separately from execution checks; full Raycast command parity remains incomplete.
See [the installed workflow catalog](../alfred-workflows.json) for versions, source
URLs, download checksums, and reviewed non-secret defaults. Third-party source and
runtime preferences remain Git-ignored, and retain their original authors.

GitFred uses username `rahulnakmol` and clone folder `~/Developer/Github`; private
results remain off. Network Quality uses Text View for results. The one bundled
GitFred hotkey and eight Audio Switcher hotkeys were cleared to preserve existing
keyboard assignments. On restore or Gallery update, reapply these preferences in
Configure Workflow and leave unneeded global hotkeys unassigned.

To restore a third-party workflow, follow its catalog Gallery link and select
Install in Alfred. Compare bundle IDs to avoid duplicates, then apply the listed
non-secret defaults. The catalog records the downloaded archive checksum; a new
Gallery release can change that checksum. It is not a lockfile or an automatic
installer.

| Raycast plugin | Alfred candidate or implementation | Remaining gap / acceptance check |
| --- | --- | --- |
| 1Password | [Official 1Password workflow](https://alfred.app/workflows/alfredapp/1password/) | Installed 26.1; CLI already installed and integration enabled. Initial authentication/search check pending with the user. Test item search/open; vault listing and password generation are not established. Authorize locally after review. |
| App Cleaner | Dedicated app-uninstall integration still needed | No validated replacement for uninstalling an app and associated files. |
| Brew | [Homebrew Search](https://alfred.app/workflows/chrisgrieser/homebrew-search/) | Installed Homebrew 2.3.0 (`bi`, `bu`). Search/install/uninstall are documented; validate upgrades, services, cleanup and cache commands separately. |
| Coffee | [Caffeine Dose](https://alfred.app/workflows/vanstrouble/caffeine-dose/) | Caffeine Dose 3.1.0 was already installed. Toggle, duration and until-time are documented; scheduled/while-process and menu-bar parity remain. |
| Color Picker | [Color Picker](https://alfred.app/workflows/zeitlings/color-picker/) | Installed 1.3.4 (`cp`, `:cp`). Screen sampling and history are documented; palette generation, image extraction, favourites, wheel and menu bar remain. |
| Downloads Manager | Alfred file navigation; latest-file workflow still needed | Open/copy/paste/reveal/delete latest download and deletion behaviour must be implemented and tested. |
| Emoji Search | [Emoji Mate](https://alfred.app/workflows/fedecalendino/emoji-mate/) | Installed 2.3.0; `; smile` returned emoji results in Alfred. Search/copy/paste candidate; verify insertion with granted Accessibility permission. |
| Ghostty | Alfred application launcher; custom workflow needed | New tab/window, tab search, launch configurations, repository workspaces, selected folder and config editor remain. |
| GitHub | [GitFred](https://alfred.app/workflows/chrisgrieser/gitfred/) | Installed GitFred 2.5.1 with public username and clone-folder defaults. Repo, issue, own PR and notification search documented; PR/issue creation, branches, workflow runs, discussions, projects and menu bars remain. Private access needs separate authorization review. |
| Google Chrome | [Browser Tabs](https://alfred.app/workflows/epilande/browser-tabs/) plus [bookmarks/history search](https://alfred.app/workflows/acidham/chromium-bookmarks-and-history-search/) | Installed Browser Tabs 1.0.8 and Chromium Bookmarks and History Search 4.5.7. Guest/incognito, named windows, window search, and combined search remain; test browser permissions. |
| Google Translate | [Translate](https://alfred.app/workflows/meshchaninov/translate/) | Installed 1.0.1; language selection pending. Translation/copy/paste candidate; verify provider, language settings and instant-selection variants before adoption. |
| Google Workspace | Included five-keyword workflow; [Google Drive](https://alfred.app/workflows/alfredapp/google-drive/) candidate | Google Drive 26.1 installed but disabled: user chose browser-only Workspace; desktop client and local Drive folder are absent. Official Drive workflow searches a local Drive mount; not equivalent to cloud API search. Starred menu bar remains. |
| Kill Process | [Axe Processes](https://alfred.app/workflows/vitor/axe-processes/) | Installed Axe Processes 25.1 (`axe`); atop 1.9.3 was already installed. TERM/KILL candidate; test only on a disposable process. |
| Linear | No verified equivalent found | Issue/project creation and search, comments, cycles, documents, views, favourites, notifications and Ask Linear remain. App/web launching alone is not parity. |
| Mole | A reviewed wrapper around Mole may preserve CLI operations | System status, cleanup, optimize, uninstall, purge, disk analysis, installer cleanup, updates and menu bar remain. Touch ID for sudo changes authentication and requires explicit approval. |
| Pomodoro | [Timer](https://alfred.app/workflows/colomolo/timer/) | Installed Timer 1.5.0 (`timer`, `timers`, `pomodoro`, `intervals`); 25-minute duration parsing passed without starting a timer. Pomodoro/intervals candidate; statistics, menu bar, and Slack status integration remain. |
| Raycast Explorer | Alfred Gallery and Preferences | Explores Raycast prompts, presets, quicklinks, themes and snippets; these are Raycast-specific assets, not installed-workflow search. No automatic conversion. |
| Safari | [Safari Control](https://alfred.app/workflows/vanstrouble/safari-control/) and [Browser Tabs](https://alfred.app/workflows/epilande/browser-tabs/) | Safari Control 2.7.0 was already installed; Browser Tabs 1.0.8 is now installed. Validate reading list, iCloud tabs, combined search, URL/title copy and close-other-tabs against the installed command list. |
| Set Audio Device | [Audio Switcher](https://alfred.app/workflows/tobiasmende/audio-switcher/) | Installed Audio Switcher 1.6.0 (`out`, `in`); output-device listing passed and bundled hotkeys are cleared. Input/output and favourite hotkeys documented; volume, automatic enforcement and paired device combos remain. |
| Slack | [Existing Slack workflow source](https://github.com/yannickglt/alfred-slack) investigated | Requires a custom Slack app; current API/runtime compatibility and snooze/unread behaviour unverified. Do not use its credential-in-command setup. No replacement installed. |
| Speedtest | [Network Quality](https://alfred.app/workflows/alfredapp/network-quality/) | Installed Network Quality 25.1 (`netquality`). Uses macOS networkQuality; test metrics and accept that its methodology differs from the Raycast extension. |
| System Monitor | [Axe Processes](https://alfred.app/workflows/vitor/axe-processes/) plus Activity Monitor | atop 1.9.3 was already installed; Axe Processes 25.1 is now installed. CPU/memory process view candidate; full system metrics and persistent menu bar remain. |
| YouTube | [YouTube Suggest](https://alfred.app/workflows/alfredapp/youtube-suggest/) | Installed YouTube Suggest 2025.2 (`yt`). Search suggestions candidate; channels, popular videos and live streams remain. |

## Hyperkey without Raycast

Active file: `karabiner/.config/karabiner/karabiner.json`. Hold Caps Lock for
Control+Option+Command+Shift; tap it for Escape. It preserves the modifier expected
by the existing app-only [Codex shortcuts](codex.md#keyboard-shortcuts-defaults-with-voice-exceptions).
The whole `~/.config/karabiner` directory is Stow-linked. Both the CLI and Settings
confirm the selected profile `Hyperland`,
with its rule enabled. This is the single shared keyboard profile for every Mac:
Karabiner provides Hyper/Escape and Right Option as Meh, Alfred handles workflow shortcuts, Rectangle Pro
handles window layouts, and Codex handles its app-specific shortcuts. Extend this
profile as the setup grows, rather than creating a separate profile per app or Mac.
The initialized ANSI virtual keyboard setting is preserved. The pre-migration
directory is backed up locally at
`~/.local/state/dotfiles/backups/karabiner-20260907-181808`.

On another Mac, install Karabiner with Homebrew, complete macOS's required permissions
yourself, disable Raycast's Caps Lock remapping, then deploy:

```sh
brew install --cask karabiner-elements
# Back up any config generated during first launch before Stow.
stow -n -v karabiner
stow karabiner
"/Library/Application Support/org.pqrs/Karabiner-Elements/bin/karabiner_cli" \
  --select-profile "Hyperland"
```

On each new Mac, finish Karabiner's required background-service, Accessibility,
input-capture, and driver setup. Match the virtual keyboard type to the hardware
(the shared default is ANSI). Then deploy Alfred and Rectangle Pro as described
above and test Hyper, tap Escape, DockFlow numbers, window layouts, and Codex
shortcuts. App licenses and macOS permissions must be set up on each device.

After an interrupted privileged installation, Homebrew can list the cask as
installed even though `/Applications/Karabiner-Elements.app` and its package
receipt are absent. In that case run `brew reinstall --cask karabiner-elements`
in an interactive terminal and complete administrator authentication. Verify the
app and services exist before switching off the working Raycast remapper.

Stow must link the whole `~/.config/karabiner` directory. Do not use `--no-folding`:
[Karabiner cannot reload changes through a symlink to karabiner.json alone](https://karabiner-elements.pqrs.org/docs/manual/misc/configuration-file-path/).
If Karabiner was already running when its directory was moved, restart its user
service as described in that guide (done on this Mac after Stow):

```sh
launchctl kickstart -k "gui/$(id -u)/org.pqrs.service.agent.Karabiner-Console-User-Server"
```

Test tap Escape, all four held modifiers,
ordinary typing, and Codex's Hyper shortcuts before disabling Raycast at login.
Do not run two active Caps Lock remappers together.

Rollback: quit Karabiner, `stow -D karabiner`, and re-enable Raycast's Hyperkey.
For Alfred, reset its preferences folder to the prior local bundle before
`stow -D alfred`. The original local Alfred bundle was empty when switching.

## Completion checks

1. On additional Macs, activate Powerpack and verify the five keyword results;
   execute a creation shortcut only when a real new file is wanted.
2. Finish configuration and execution checks for the installed Gallery workflows above.
   Review authentication changes before connecting 1Password, GitHub, Slack or
   Linear. Never commit workflow variables containing credentials.
3. Resolve the gaps above or explicitly accept a different workflow for each.
4. Check core Raycast features separately: clipboard, snippets, quicklinks, notes,
   window management, AI and dictation. Installed extensions do not inventory
   their contents. No private history has been migrated.
5. Hyperkey cutover and physical Rectangle, Escape, and Alfred DockFlow shortcut
   checks passed on this Mac. Repeat after a fresh login and on additional Macs;
   also check Alfred's Option+Space launcher hotkey.
6. Disable Raycast launch at login and quit it only after acceptance. Retain a
   private export for rollback before uninstalling it.

Run `node --test scripts/test-launcher-config.mjs` for source and Stow checks.
These checks do not claim real keyboard, third-party integration or UI parity.

## Hyper navigation and workspaces

The Hyper workflow extends this foundation with a searchable menu, app launching,
desktop navigation and Work/Code/Zen layouts. See [the Hyper setup guide](hyper.md).
The single Karabiner profile is **Hyperland**. Each app has one direct shortcut:
A Amp, S Slack, D Chrome, F Finder; H Ghostty, J ChatGPT/Codex, K Cursor, L Claude;
W Word, E Edge, I Teams, O Excel, P PowerPoint, R Safari and N Obsidian.
Z Final Cut Pro, X Motion and C Compressor form the media sequence (edit, animate,
export); they work where installed. No creative apps are installed by this configuration.
Hyper+Return maximizes; Hyper+left bracket/right bracket/backslash tiles thirds.
Native Control+Left/Right switches adjacent desktops; Hyper+numbers selects one.
Codex alone uses Hyper+V/M for voice/dictation. B/G/Q/T/U/Y remain free.
Generate changes from
`scripts/hyper-config.json` with `node scripts/build-hyper-config.mjs`.
