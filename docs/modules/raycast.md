# Raycast on macOS

For the replacement project, see [Alfred migration and plugin parity](alfred.md).
The command declarations for all 23 installed plugins are recorded in
[the inventory](../raycast-extensions.json).

Raycast's reusable setup is recorded here as a manual restore checklist. This is
not a Raycast-readable config file or a full backup. Raycast v2 stores its live
settings in databases and provides encrypted `.rayconfig` exports for migration;
the inspected installation has no standalone settings file suitable for GNU Stow.
No live Raycast files were moved, symlinked, decrypted, or added to Git.

## Install and restore

```bash
brew install --cask raycast
```

Open Raycast Settings and apply the preferences below. For a full migration,
use Raycast's own Export Settings & Data and Import Settings & Data commands.
Keep the encrypted export outside this repository and store its passphrase in
1Password. Enter it directly in Raycast, never in a script or Git.

Exports can include chats, clipboard history, notes, snippets, and other personal
data. During import, select only the categories you intend to restore. Export
files, live databases, extension caches, and AI provider files are excluded from
Git. An export is a private backup, not a reviewable shared dotfile.

See the [official import/export guide](https://manual.raycast.com/import-export).

## Current preferences

Observed in the running Raycast app on September 7, 2026. This captures the General
and Keyboard pages, not every extension's settings. No account data or credentials
were copied. Theme names were not exposed by the inspected controls.

| Settings page | Preference | Current value |
| --- | --- | --- |
| General | Open at Login | On |
| General | Show in Menu Bar | Off |
| General | Raycast Hotkey | Command+Space |
| General | Follow System Appearance | On |
| General | Interface Size | Default |
| General | Window Mode | Compact |
| General | Show Favorites in Compact Mode | On |
| Keyboard | Escape Key Behavior | Navigate back or close window |
| Keyboard | Escape Key Closes Window | On |
| Keyboard | Auto-switch Input Source | None |
| Keyboard | Navigation Bindings | Emacs (Control+B/F/P/N) |
| Keyboard | Page Navigation Keys | Square Brackets |
| Keyboard | Hyper Key | None (Karabiner now supplies Hyperkey) |
| Keyboard | Include Shift | On |

After the September 7 cutover, Karabiner holds Caps Lock for
Control+Option+Shift+Command and taps it for Escape. This supplies the Hyper
modifier used by the [Codex shortcuts](codex.md#hyperkey-workflow-shortcuts).
Raycast's remapper is disabled to avoid two apps handling Caps Lock. Its previous
Quick Press and Secure Input Compatibility controls are no longer shown.
DockFlow profile launchers now live in the [Alfred workflow](alfred.md#dockflow-profiles-in-alfred).
The seven Raycast quicklinks remain, but their Hyper+0/1/2/3/4/5/9 bindings were
cleared after migration to avoid duplicate handlers. Raycast stays available for
the other integrations still awaiting migration.
The Codex bindings are app-only; a matching global
Raycast hotkey can intercept them, so review assignments before adding more.

The ChatGPT application entry had no alias or hotkey assigned in Raycast. The
complete set of other command aliases and hotkeys has not been captured here.

## Installed Store extensions

The following extension names were visible in Settings. Reinstall those needed
from the Raycast Store, then sign in separately. Their settings, credentials, and
downloaded code are not vendored in dotfiles.

- 1Password, App Cleaner, Brew, Coffee, Color Picker
- Downloads Manager, Emoji Search, Ghostty, GitHub, Google Chrome
- Google Translate, Google Workspace, Kill Process, Linear, Mole
- Pomodoro, Raycast Explorer, Safari, Set Audio Device, Slack
- Speedtest, System Monitor, YouTube

## Script commands and GNU Stow

The inspected Script Commands page had no configured script folders, so there
were no existing scripts to migrate. A `raycast` Stow module has not been created.
Do not run `stow raycast` or `stow --adopt` against the live application data.

If script commands are added later, place reviewed source files under
`raycast/.config/raycast/scripts/`, deploy with `stow --no-folding raycast`, and
register `~/.config/raycast/scripts` in Settings > Script Commands. That can make
the script source portable; hotkeys and the folder registration still belong to
Raycast's settings. See [Script Commands](https://manual.raycast.com/script-commands).

## Updating this checklist

Review the corresponding settings pages and edit this document when preferences
change. Use a private Raycast export for complete state recovery. Do not dump the
preferences plist or databases into Git to approximate a configuration export.
