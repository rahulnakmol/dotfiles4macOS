# Native Raycast workspaces

Date: 18 October 2026. Status: accepted; supersedes the default local-extension
installation in [ADR 0005](0005-workmode-local-install.md).

Use native Raycast layouts for window geometry, native Raycast Script Commands
for coordination, Quicklinks for destinations, DockFlow for Dock contents, and
Session for timers. Focus defaults to 45 minutes. Share 15 workflow variants with
Laptop and Desk recipes; prefer two-thirds/one-third splits. Zen Code uses Zed,
Ghostty, Chrome Canary and Notion.

The runtime uses macOS shell/JXA and needs no extension developer mode or build.
Native import/export carries window recipes; per-Mac display mapping and command
links remain local. Layout dispatch is asynchronous, so Focus confirms readiness
before requesting a timer. No background watcher or custom Space/window engine.

Preserve unrelated apps/timers. Protect already-running remote clients from
layout replay. Native aliases and hotkeys are assigned through supported Raycast
UI, never private database writes. Remove the legacy custom extension, its developer-mode installer and extension-only
configuration/tests. Git history retains the earlier implementation for recovery.

See [setup](../modules/raycast.md) and [shortcut ownership](../hotkeys.md).
