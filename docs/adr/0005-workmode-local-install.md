# Keep Workmode small and install it locally

## Context

Users need the same optional macOS work modes on more than one Mac. Raycast
already supplies app launching, Hyper, window commands, clipboard and Quicklinks.
Workmode adds value by coordinating these tools, not by replacing them.

## Decision

Use one list of eight modes. Keep native app and keyboard actions in Raycast.
Use DockFlow's CLI for Dock profiles and Session's URL handler for timers. Keep
the existing capture and Google menus as small URL dispatchers.

Use one installer with separate `build`, `install`, `check` and `rollback`
actions. The Finder launcher calls the same script. `install` builds and tests,
Stows reviewed config, then imports through `ray develop`. The user stops the
watcher with Control+C; the extension remains installed.

## Alternatives and trade-offs

| Option | Decision | Reason |
| --- | --- | --- |
| Build without import | Keep as `build` | Useful for validation; does not install into Raycast. |
| Supported local CLI import | Use for `install` | Requires one Control+C step but no custom installer service. |
| Write Raycast's private databases | Avoid | Couples setup to an internal format and private state. |
| Publish through the Store | Defer | Needs a separate review and distribution process. |
| Remove all direct command files | Avoid | Their aliases are useful; each file delegates to shared logic. |
| Add a generic plugin or mode-variant framework | Avoid | The current modes do not need it. |

## Consequences

| Benefit or limit | Result |
| --- | --- |
| Small runtime | Three dependencies: Raycast API, config validation and a crash-recoverable lock. No new daemon. |
| Per-Mac helper | A small Swift command lists running apps and requests normal quits; build it on each Mac. |
| Optional setup | Core Stow stays separate. Conflicts stop installation instead of adopting files. |
| Clear recovery | Retry a failed import. Rollback unlinks config; remove the extension in Raycast to disable bundled defaults too. |
| Manual completion | Licenses, permissions, native shortcuts, four Space assignments, Dock presets and Session categories remain per-Mac steps. |
| Honest validation | Build/tests do not prove every live window or timer transition. Keep known limits in the [Raycast module](../modules/raycast.md#fix-a-problem). |

[Installer and usage](../modules/raycast.md) ·
[Official CLI](https://developers.raycast.com/information/developer-tools/cli) ·
[Local import lifecycle](https://developers.raycast.com/basics/create-your-first-extension)
