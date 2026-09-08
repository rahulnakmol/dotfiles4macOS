# 0003 — Focus app isolation and complete window layouts

Status: accepted through the user's corrected focus/layout requirements, September 9, 2026.

## Context

Focus must leave only the chosen working apps open. Work uses Edge and Teams;
Code uses Amp, Cursor or Codex with Chrome/Ghostty, or Claude with Obsidian/Ghostty.
Window layouts should open and arrange those complete sets without quitting apps.
The user already maintains four desktops with native app assignments.

## Decision

`fs` enumerates running regular macOS applications and normally quits every app
outside the selected set. Keep Finder, Alfred, Rectangle Pro, DockFlow and Session;
background/menu-bar agents are excluded. Preserve target apps, including shared
browser/terminal processes. No remembered session ID is needed. A process lock
serializes switches. Preflight missing apps/Session and invalid duration before
quitting. Wait for save/terminal prompts; stop on refusal, timeout or remaining
non-target apps before launching, arranging or requesting the timer.

`wl Code Amp/Claude/Cursor/Codex` uses the complete three-app Rectangle layout with
launching enabled and switches DockFlow to Code. It never enters the quit/timer
path. Reference app is left two-thirds, Ghostty right third, coding app maximized.
The existing native Dock assignments place apps; no desktops or assignments are
created, removed or changed. Another Mac needs the same four-desktop setup.

## Alternatives

Quitting only the previous configured set missed unrelated apps and did not meet
the focus requirement. Restarting shared target apps was unnecessary. Killing
background processes would disrupt the shell and automation. Force termination
would discard save prompts. Rectangle's own quit option is not used because `wl`
must remain non-destructive and focus needs an explicit quit barrier.

## Consequences

A focus switch can close unrelated work, subject to normal save prompts. If a
later quit fails, earlier apps stay closed. Apps that reopen during the quit pass
stop the switch; apps opened by the user later are not continuously policed.
Unbundled regular apps are addressed by PID. Session controls timer behavior.
The full sequence is tested with substitutes; do not run a destructive live test
against unsaved work. `wl` has no quit or timer behavior. Four desktop assignments
are user-confirmed on this Mac. Rectangle native snapshot import is required when
layout definitions change; no private Space IDs are stored.

References: [Apple normal quit API](https://developer.apple.com/documentation/appkit/nsrunningapplication/terminate()),
[Rectangle layouts](https://rectangleapp.com/pro/docs/layouts/).

## Session timer extension — September 9, 2026

After the app/layout sequence succeeds, send one Session `/start` URL with the
focus intention and configurable duration: Work 30 minutes, all Code variants
45 minutes. Check an installed Session edition before any quits. Prefer the
vendor URL API over a duplicate timer, Apple Shortcuts wrapper or UI scripting.
Do not automatically retry this non-idempotent start request, finish/abandon an
existing timer or quit apps at expiry. Session controls prompts and completion.
The URL's delivery does not acknowledge timer state; the tested direct API call
showed a live 45-minute Code + Codex countdown. Tests verify durations, URL encoding,
ordering, missing Session, failure barriers and one start request per invocation.

Source: [Session URL scheme](https://www.stayinsession.com/learn/session-url-scheme).
