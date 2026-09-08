# 0003 — Explicit focus sessions with normal application quits

Status: accepted through the user's focus-session requests, September 8, 2026.

## Context

The user wants Work with only Edge and Teams, and four Code variations. Amp, Cursor and
Codex each use Chrome and Ghostty; Claude uses Obsidian and Ghostty. Changing
sessions must quit outgoing applications completely. Coding uses two desktops.

## Decision

Add explicit Alfred `focus work|amp|claude|cursor|codex` choices to the existing Hyper
workflow. Keep ordinary layout commands and DockFlow number shortcuts unchanged.
Use Apple's native normal-quit API, wait for each app to exit, then open the next
set. Preflight missing target apps before any quit. A pending save/terminal prompt
stops progress after 30 seconds; never force termination.

Store only the last successful session ID locally. This allows shared Chrome and
Ghostty to quit on a real variation change, while repeated selection preserves the
active apps. On first use without history, preserve target apps and quit other
configured-session apps. A process lock serializes switching across launch paths.

Use Rectangle presets for Desktop 1's reference/terminal two-thirds/one-third split
and Desktop 2's maximized coding app. Native Dock desktop assignments must be made
once on each Mac. Do not copy private Space IDs or claim Rectangle reconstructs
numbered Spaces. Unlike the earlier general workspace setup, these focus-specific
apps now have explicit desktop homes. All coding variants select DockFlow Code.

Generate Markdown and standalone HTML documentation with the Alfred guide from
the same source. Keep helper source in the Stow workflow; compile with Apple
Command Line Tools into a cache keyed by source, architecture and OS build.

## Alternatives

Quitting every foreground app would also close unrelated work. Closing windows or
hiding apps would not meet the requested full-quit behavior. Force termination
would discard normal save prompts. Private macOS Space APIs could automate more
placement but would add OS-sensitive code to a portable personal configuration.

## Consequences

Only the five configured session sets participate in quitting. Switching coding
variants restarts shared terminal/browser processes and can interrupt work; the
user's ordinary application prompts remain in control. A cancelled switch may
leave earlier apps already quit. A failed launch can leave a partial target set.
Retry is supported; the helper does not pretend these OS actions are transactional.

Tests use a substitute desktop to exercise missing apps, quit cancellation, shared
app restarts, reselection, first-run behavior and ordered layouts. Physical desktop
assignment and a live switch with saved work still need acceptance on each Mac.
The sessions do not toggle macOS notification Focus modes.

References: [Apple normal quit API](https://developer.apple.com/documentation/appkit/nsrunningapplication/terminate()),
[Rectangle layouts](https://rectangleapp.com/pro/docs/layouts/).
