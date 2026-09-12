# Workmode: compose native tools and install locally

## Context

Workmode is an optional macOS extension in dotfiles. Users need a reproducible
way to build and install it on each Mac. Raycast already supplies app launching,
Hyper, window commands, clipboard and Quicklinks. Reimplementing these would add
maintenance without improving the coordinated workspace workflow.

## Decision

Keep one purpose: coordinate named work modes using Raycast window management,
DockFlow's CLI and Session's URL handler. Keep native app/keyboard actions in
Raycast. Existing capture and Google menus remain small URL dispatchers because
users already rely on them. Do not add new wrappers for native features.

Use one shell entry point with separate `build`, `install`, `check` and
`rollback` actions. `install` builds/tests source, Stows reviewed configuration,
then runs the official `ray develop` import. Control+C stops the watcher; the
extension stays installed. The Finder launcher calls that same entry point.
Keep the previous `apply` action as prepare-only compatibility.

Keep one list of eight modes. Remove unused variant machinery and the unused
browser-context setting. Preserve direct command entry points because Raycast
registers each alias/hotkey against a command; each delegates to shared logic.

## Alternatives and trade-offs

- Build alone is useful for validation but does not install into Raycast.
- A custom background installer or private database writer would add brittle
  lifecycle/settings logic. The supported CLI leaves one explicit Control+C step.
- Store distribution could remove the source toolchain requirement, but needs
  a separate publication/review process. No publishing pipeline is needed now.
- Removing all small alias commands would shrink the manifest but remove the
  keyboard workflows the user requested. Keep the wrappers, not duplicate logic.

## Consequences

No new runtime dependency or daemon. The existing dependencies each have a job:
`@raycast/api` for UI/window APIs, `zod` for boundary validation and
`proper-lockfile` for crash-recoverable exclusion. The small Swift helper only
lists running apps as JSON and requests normal quits; it is compiled per Mac.

Build does not Stow or import. Install is opt-in and stops on conflicts instead
of adopting existing files. A failed import can be retried; it may leave the
successfully Stowed config in place. Rollback unlinks configuration but does not
uninstall the extension, which can still use bundled defaults. Remove Workmode
in Raycast Settings to disable it.

Licenses, permissions, aliases, four Space assignments, Session categories and
DockFlow presets require documented per-Mac setup. Tests do not establish that
every app window or timer transition works; the existing Zen cold-launch and
Session reflection limitations remain documented.

Sources: [CLI](https://developers.raycast.com/information/developer-tools/cli),
[local install and stop behavior](https://developers.raycast.com/basics/create-your-first-extension),
[prerequisites](https://developers.raycast.com/basics/getting-started).
