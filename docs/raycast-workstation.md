# Workmode — Raycast setup and migration

Created by Rahul N Akmol. **Migration in progress:** the custom extension has been
built and imported on the current Mac. Raycast uses Option+Space; Spotlight's
Command+Space shortcut is enabled. Alfred is quit and its login startup is off.
Native Caps Lock Hyper is active, with Include Shift and tap Escape. The remaining
application/window hotkey migration is pending; see the [hotkey audit](raycast-hotkey-audit.md). Do not treat this
page as confirmation that every mode is live-tested.

## One setup, eight modes

Both FDE and TF use the same optional productivity source. The target uses Raycast
for Hyper, launching and window management; Karabiner, Alfred and Rectangle Pro
are not dependencies. Keep Session for timers and DockFlow for saved Dock contents.
The Raycast Dock extension only changes Dock position; native window layouts do
not replace Dock profiles. Their older installers
remain available during migration; this new setup currently installs alongside
them, without automatically changing their startup or keyboard settings.

| Mode | Dock preset / proposed Meh key | Apps | Session |
|---|---|---|---|
| Default | `0. Default` / 0 | Zen | No timer |
| Work | `1. Work` / 1 | Edge + Teams + Claude | 30 · Work |
| Code | `2. Code` / 2 | Zen + Amp + Ghostty + Slack | 45 · Code |
| Author | `3. Author` / 3 | Zen + Claude + Obsidian | 45 · Author |
| Design | `4. Design` / 4 | Zen + Figma + Affinity | 45 · Design |
| Innovate | `5. Innovate` / 5 | Zen + Codex + Ghostty + Slack | 45 · Innovate |
| Video | `6. Video` / 6 | Final Cut Pro + Motion + Finder | 45 · Video |
| Zen | `9. Zen` / 9 | Zen + Obsidian | 25 · Zen |

Video apps need not be installed. Their
keys remain reserved in `hotkeys.json`; assign each native Applications hotkey
after installing its app. There are no custom single-app launch commands.
Attempting a mode with a missing prerequisite reports
the missing app before any quits. Telegram remains a shortcut-only app.

Every Mac uses four ordinary desktops:

| Desktop | Purpose | Code / Innovate |
|---|---|---|
| 1 · Home | Finder, Session and everyday apps | Support apps |
| 2 · Connect | Browser + chat | Zen left ⅔ + Slack right ⅓ |
| 3 · Create | AI, coding and creative tools | Amp / Codex maximized |
| 4 · Focus | Terminal, notes and focused work | Ghostty maximized |

Work uses Edge ⅔ + Teams ⅓ on Desktop 2 and Claude on Desktop 3. Author and Zen
put Obsidian on Desktop 4. Design puts Figma on 3 and Affinity on 4. Video uses
Finder on 1, Final Cut on 3 and Motion on 4. These are tiled/maximized windows on
ordinary desktops, not native fullscreen Spaces.

## Install

1. Install/enable Raycast Pro, Zen, DockFlow, Session and the apps your modes need.
   Do not install Karabiner, Alfred or Rectangle Pro for this setup.
2. In a clone of the dotfiles repository, run:

   ```sh
   bash scripts/setup-raycast-workstation.sh plan
   bash scripts/setup-raycast-workstation.sh install
   ```

   Or double-click `setup/Raycast.command`; it invokes the same `install` command.
   Prerequisites: macOS, Node 22.18+ and npm (`brew install node`), GNU Stow
   (`brew install stow`), Xcode Command Line Tools (`xcode-select --install`) and
   Raycast (`brew install --cask raycast`). Sign in directly in Raycast if asked.
   The installer builds/tests source, links curated configuration and imports it;
   it does not install or license apps or change system permissions.
3. After “Importing Workmode”, wait for its ready message; Control+C stops development. The extension remains
   installed. Repeat the import after updating source.
4. Create four desktops in Mission Control and turn off automatic Space reordering.
   Navigate to Desktop 1, open Raycast and run **Check Workmode Setup** (`wchk`).
   Select **Desktop 1** and run **Assign This Space to Desktop 1**. Repeat while on
   Desktops 2, 3 and 4. The screen shows each purpose and a Ready / Needs setup
   status, not internal IDs. Reassign after recreating desktops or changing displays.
   With multiple displays, focus an app on the intended display first.
5. In **Session**, manually create Work, Code, Innovate, Author, Design, Zen and
   Video categories. The URL handler selects existing categories; it does not create
   them. Resolve any existing-timer prompt when starting a new timer.
6. Update DockFlow to the exact unique names above. Export your final presets using
   DockFlow's normal export UI, then sanitize before adding them to dotfiles. The
   Required names include `4. Design`, `5. Innovate` and `6. Video`.
7. Choose and configure Zen Spaces/containers or separate profiles. **Mode commands
   currently leave browser-context selection manual.** Zen is the browser for all
   non-Work modes; Work retains Edge. No Safari mode is created.

The installer is optional for both FDE and TF. Default/manual core Stow never
includes it. Use `build` instead of `install` to validate without Stowing or
importing. The older `apply` action still only builds and Stows; it does not import.
Repeat `install` after pulling source changes. Stow conflicts stop installation
before any files are adopted. Import failures can be retried; the linked config
remains available.

The install script Stows curated `.config/raycast-workstation/` files, builds
the local helper and validates the extension. It never copies credentials, browser
profiles, Raycast databases, clipboard history or private export files.

The local installation follows Raycast's [official CLI](https://developers.raycast.com/information/developer-tools/cli)
and [development-to-installed workflow](https://developers.raycast.com/basics/create-your-first-extension).
No Store publication or private team distribution is implied. See the
[scope decision](adr/0005-workmode-local-install.md) for the Unix/YAGNI boundaries.

## Commands and shortcuts

**Option+Space opens Raycast. Command+Space opens Spotlight.** These have separate
shortcut ownership. Desktop role names (Home, Connect, Create, Focus) are labels
in Workmode; macOS retains Desktop 1–4.

Use the extension's searchable command names immediately. Set these aliases in
Raycast Settings → Workmode: `hk`, `wl`, `fs`, `df`, `ss`, `wchk`, `cs`, `gw`.

- **Window Layout** changes the Dock and arranges mode apps without closing others.
- **Focus Session** preflights, previews the apps to quit, finishes the outgoing
  Session timer, uses normal quits, then arranges windows and requests its
  categorized Session timer. Codex/ChatGPT follows the selected app set: it stays
  open for Innovate and is quit normally when another focus mode excludes it.
- **DockFlow Profile** changes the Dock only.
- **Session Timer** offers 20/25/30/45/60 minutes. Its action panel offers categories.

The complete proposed keyboard map and ownership migration are in
[the migration plan](raycast-workstation-plan.md#keyboard-ownership). Caps Lock is
Hyper through Raycast's native Keyboard settings (Include Shift on; quick press
Escape). Meh means the physical Control+Option+Shift chord. Right Option and Right
Command stay normal: the inspected Raycast UI exposes only one remapped Hyper key. Preserve Codex-native
Hyper+B pet toggle, Hyper+V voice and Hyper+M dictation. Window management uses
Control+Option with the Rectangle-style preset and a proposed comma/period Space pair. App hotkeys remain one per app.

Use native **Applications** entries for app launch hotkeys. Use **Quicklinks** for
websites, folders and specific app destinations. The extension handles coordinated
mode operations; it does not add duplicate “Launch…” commands.

## Cutover checklist — pending

- Export Raycast's current settings through its normal private backup flow.
- Confirm a real native Raycast resize and a complete Work arrangement.
- Validate Code windows including Ghostty with the user's physical check if
  computer-use access remains unavailable.
- Configure native Raycast hotkeys/aliases, disable conflicting Alfred bindings,
  and disable Karabiner entirely as one recorded migration. Enable native Raycast
  Caps Lock Hyper, Include Shift and tap Escape.
- Keep Raycast on Option+Space and enable Spotlight on Command+Space. Clear any
  competing Alfred launcher binding; do not disable Spotlight in new-Mac setup.
- Validate native Caps Hyper and the physical Meh chord, window fractions, display moves and Codex B/V/M.
- Disable Karabiner/Alfred/Rectangle login startup only after those checks pass.
- Test login and a second Mac; then retire old productivity installer defaults.

Raycast Cloud Sync is already on for this Mac. Script source, local desktop maps
and credentials still require per-device setup. A local extension import is not a
private team-store publication. Do not assume a personal Pro license hosts source
for another user automatically.

## Check and rollback

```sh
bash scripts/setup-raycast-workstation.sh check
bash scripts/setup-raycast-workstation.sh rollback
```

Rollback unstows only the curated workstation config. The extension remains
installed and can still use bundled defaults; remove Workmode in Raycast Settings
to disable it completely. Rollback does not delete Cloud Sync data, browser
contexts or application data. Disable new
hotkeys and restore the private Raycast settings backup before re-enabling old
Alfred/Rectangle bindings. No rollback can reconstruct unsaved application work.

The macOS install command was run on 13 September 2026: locked dependencies,
Swift compilation, production build, Stow and Raycast import completed. After
stopping the watcher, `wl` still opened all eight modes. Source/link checks and
62 tests passed, including isolated installer failure cases. This is installation
validation, not a fresh execution of focus sessions or window arrangements.

The source tests cover prerequisites, cancellation, timer ordering, Dock preset
uniqueness, key conflicts and mode membership. They do not substitute for live
multi-display placement or physical keyboard verification.

## Why DockFlow and Session remain

Session is retained by choice, including category history and the existing timer
commands. No competing Raycast timer is assigned. DockFlow remains the profile
store for Dock apps, order and folders. Raycast invokes it through `df`, layouts
and focus sessions; DockFlow does not own global keyboard shortcuts.

Sources: [native Hyper](https://manual.raycast.com/hyper-key),
[Dock extension](https://www.raycast.com/pradeepb28/dock),
[window layouts](https://manual.raycast.com/window-management).

## Performance approach

Use native Applications and Window Management hotkeys for single actions; those
avoid launching our extension. The extension runs on demand for coordinated modes.
It has no resident watcher or polling loop when idle. Stop `npm run dev` after
import; it is a development tool, not a login dependency.

During a mode switch, apps and desktops are read once in parallel. That inventory
is reused only within that command; the next command reads fresh data. Focus
rechecks after its confirmation dialog, so a long preview cannot authorize a stale
switch. Dock preset names are rechecked after save prompts. Window movement and
normal quits remain sequential to avoid competing focus changes and save dialogs.

The former unconditional 350 ms pause per window is removed. Each window is checked
immediately, retrying every 200 ms only while it settles, up to 30 reads. Four-window
Code/Innovate execution now needs one application inventory read and one desktop
inventory read, rather than nine and five for the former focus execution path
(excluding its separate preview). This removes 1.4 seconds of fixed pauses; it is
not an end-to-end benchmark or a guarantee of a 1.4-second faster switch. Application
startup and macOS Space transitions still determine real latency.

Read-count and polling tests cover immediate success, delayed readiness, temporary
errors and bounded failure. Live mode-switch timings still need measurement.

## Troubleshooting: “Cannot get window”

On this Mac, Raycast intermittently rejected `setWindowBounds` with
“Cannot get window”, including windows successfully returned by `getActiveWindow`.
Omitting a redundant `desktopId` first cleared the error, but repeat testing showed
it could still occur. Workmode omits that field for same-Space resizing and retries
only this exact lookup error, up to three attempts with a fresh app-window read
and a 200 ms delay between failures. It does not delay successful first attempts
or retry permission errors. The native cause of the intermittent lookup failure
is not established; this is a bounded recovery, followed by bounds verification.
Existing Desktop assignments do not need resetting for this error. Placement
errors name the app, target Desktop and failed operation.

Fresh-launch testing also found successful native calls that left Obsidian on the
wrong Space. Workmode now checks the placement before issuing a mutation and
skips windows already arranged. If a successful call has not reached the target,
it retries the placement/verification cycle, up to three cycles. Each cycle uses
bounded polling; unrelated mutation failures still stop immediately. Completion
requires the requested Desktop and window bounds, not just an API success reply.

Verified on 13 September 2026:

- Minimal reproduction: `wl` → Default found Zen's window on Desktop 2, then
  failed while explicitly moving/resizing it onto that same Desktop.
- Hiding Raycast before placement did not resolve the failure; that experimental
  change was removed.
- Omitting the redundant Space move allowed Default to finish and verify bounds.
- Work completed with Edge, Teams and Claude; an earlier run also verified Edge
  moving from Desktop 3 to Desktop 2 before proceeding to Teams.
- Regression tests cover both same-Space resizing and preserving a different
  destination for a real move. The same-Space test failed with the old request
  and passed with the fix.

### Live acceptance results — 13 September 2026

| Layout | Result on this Mac |
| --- | --- |
| Default | Passed from closed apps: Zen maximized on Desktop 2; Default Dock applied. |
| Work | Passed from closed apps: Edge ⅔ + Teams ⅓ on Desktop 2, Claude maximized on Desktop 3; Work Dock applied. |
| Author | Passed from closed apps after placement recovery was added: Zen on 2, Claude on 3, Obsidian on 4; Author Dock applied. |
| Zen | Passed from closed apps after placement recovery was added: Zen on 2, Obsidian on 4; Zen Dock applied. |
| Design | Passed from closed apps: Zen on 2, Figma on 3, Affinity on 4; Design Dock applied. Affinity's earlier sign-in blocker was no longer present. This tests window arrangement, not editing or authentication. |
| Code | Required apps installed; live test blocked by Computer Use denying Ghostty access. |
| Innovate | Required apps installed; live test blocked by Computer Use denying Ghostty access. |
| Video | Explicitly excluded from this test run. |

These were `wl` tests: no focus-session quit actions or Session timers were run.
For the fresh-launch pass, the tester normally quit the other regular apps before
each layout, keeping Codex and the required Raycast/DockFlow/Finder components.
Running-app inventories confirmed that baseline. Test apps were closed again at
the end; no force quits or document-discard actions were used.
“Passed” means the command verified window bounds and destinations and completed
the DockFlow apply call. It does not establish reliability across every startup
state. Earlier cold launches exposed timeouts, an unarrangeable Obsidian starter
window, and native move calls that had not reached their destination. The final
Author and Zen fresh-launch runs verified Obsidian on Desktop 4 before completing.
An app that still presents a first-run/sign-in dialog needs its normal setup first.

The development console records mode completion/failure, app IDs, window bounds,
retry attempts and source/target Space IDs, without window titles or document
contents. Automated regression tests cover transient recovery, exhaustion after
three failures, and immediate propagation of unrelated errors.

## Extension name and publication

The visible extension name is **Workmode**. Its installed `workstation` identifier,
command IDs and configuration paths remain stable to preserve aliases and local
desktop mappings. The name is not reserved in the Store, and this is not a published
extension. Before submission, finish standalone onboarding, native-helper packaging,
a 512×512 icon, screenshots, linting and fresh-Mac acceptance. See the
[Raycast submission requirements](https://developers.raycast.com/basics/prepare-an-extension-for-store).

The [installed-extension audit](raycast-extension-audit.md) records removal candidates
and why other integrations remain useful. No installed extension was removed.

See the complete [2–4 character alias guide](raycast-aliases.md) for apps, windows, utilities and Dock profiles.

### Direct layout and focus aliases

Use `wco` / `fco` for Code, `wwo` / `fwo` for Work, or the other short aliases
in the [alias reference](raycast-aliases.md#direct-layouts-and-focus-sessions).
Each opens its specific mode; Return then arranges the layout or previews focus.
Focus still requires Start Focus confirmation before quitting apps.
All 17 direct aliases passed live routing checks on 13 September 2026.

### Slack minimum width in Code focus

On narrow displays, Slack may enforce a minimum width larger than one third.
Workmode first requests the normal split. If the resized chat window is on the
correct Space, right-aligned, full-height and no wider than half the display,
Workmode accepts the constrained width and resizes the left browser to fill the
remaining space. Wrong Spaces, arbitrary positions and oversized windows still
fail. The timer is requested only after both windows verify.

Diagnosis, 13 September 2026: the isolated Slack placement requested 570 px at
x=1140 on a 1710 px desktop. Slack remained 668 px at x=1042 on Desktop 2, causing
the old exact-width verification to fail after three attempts. After the fix,
the same Slack placement verified and Zen resized from 1140 px to 1042 px.
Raycast displayed “Slack placement verified”; native geometry confirmed no overlap.
The regression test failed with `undefined` instead of the fitted rectangle before
the fix and passed afterwards. This test isolated Slack and Zen; the full Code
focus session, including Ghostty and the Session timer, still needs a user run.

### Interrupted mode switches

An active mode switch holds a shared lock so two commands cannot arrange windows
or quit apps concurrently. The lock refreshes every 10 seconds while work is
running. If Raycast terminates the command, a later attempt can recover the lock
after 60 seconds without a refresh. Normal completion and errors release it
immediately. The active-lock message asks you to retry; no manual deletion is
needed for this lock.

The implementation uses [proper-lockfile](https://github.com/moxystudio/node-proper-lockfile)
for atomic acquisition, heartbeat updates and stale recovery, instead of extending
the old permanent marker with custom concurrency logic. It adds a small runtime
dependency and one filesystem refresh per 10 seconds only during a mode switch.

Regression evidence: an abandoned-lock test failed with EEXIST under the former
marker logic and passes with recovery. Tests also cover concurrent exclusion,
release after failure, and preservation of filesystem error causes. On this Mac,
the stale legacy `switch.lock` was archived after verifying its age exceeded nine
minutes and no mode-switch helper was running. The temporary Codex debugging exemption has been removed; normal app selection
now governs whether it is quit.

### Switching Session timers

After confirmation and successful preflight, focus switches send Session's
[documented finish request](https://www.stayinsession.com/learn/session-url-scheme)
before quitting apps. The next start request is sent only after windows and Dock
are ready. Layout-only commands never finish or start timers. A failed preflight
leaves the old timer alone; a later failure leaves it finished and does not start
a new one.

For automatic handoff, Session → Settings → General → **Ask for Reflection when
Session has ended** must be off. If kept on, submit the reflection manually
before requesting another timer with `ss`. In the live test, finish stopped the
Work timer and opened reflection; a subsequent Code start request during reflection
was ignored, including after reflection auto-submitted. The preference has not
been changed pending the user's choice. The finish action preserves elapsed work;
we do not abandon the session or discard its history.

Zen diagnosis: the browser/Slack pair passed while Zen was running. A fresh launch
reproduced `Zen Browser: moving/resizing its window to Desktop 2 failed: Cannot
get window`, despite a readable active window on the correct Space. Extending
lookup retries from 400 ms to 5.8 seconds did not fix it and was reverted. Later
identical runs passed. The intermittent native resize failure remains unresolved;
no blanket delay or weakened geometry check has been added.

T3 Code is no longer offered as a window layout or focus session. Its `ft3` command has been removed.
