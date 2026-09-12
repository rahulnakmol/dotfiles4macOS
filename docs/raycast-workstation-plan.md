# Unified Raycast workstation

Status: researched plan and implementation in progress, September 12, 2026. This document describes the target;
the application/window key migration is not complete. Raycast uses Option+Space;
Spotlight's Command+Space is restored; Alfred is quit with login startup disabled.
Author: Rahul N Akmol.

## Decision

Use one optional macOS productivity setup for everyone: **Raycast Pro + Zen +
DockFlow + Session**. Raycast owns the launcher, native Hyper key, application
hotkeys, window management and workflow menus. There is no Karabiner, Alfred or
Rectangle Pro dependency in the new setup. Keep core CLI/editor installation
independent; FDE and TF share the productivity configuration.

**Session stays**, by explicit user choice. DockFlow stays for saved macOS Dock
contents and ordering: the inspected Raycast Dock extension changes Dock position,
not saved app/folder profiles. Native Raycast window layouts arrange windows,
which is a separate job. No supported equivalent for the existing Dock profiles
was found. Reimplementing Dock preference storage/restarts in a custom extension
would add maintenance without improving this migration.

Alternatives considered: retain Alfred/Rectangle (duplicates ownership), or replace
Session and DockFlow too (loses the requested Session integration and requires a
custom Dock persistence layer). The chosen setup centralizes every interaction in
Raycast while retaining these two specialized integrations. CleanShot X remains
the screenshot tool. Zen is the default browser; Work explicitly uses Edge.

The trade-off of removing Karabiner is that its mouse remaps and separate Right
Option → Meh conversion do not carry over automatically. Raycast's native Hyper
supports Caps Lock, Include Shift, and a quick tap for Escape. Its inspected UI
exposes one remapped key. **Meh in this guide means physically holding
Control+Option+Shift**; Right Option and Right Command stay normal. A second
single-key layer must not be advertised as implemented.

## What was actually inspected

- Raycast **2.3.1.0**, Open at Login enabled, launcher currently **Option+Space**.
- Raycast Cloud Sync enabled, one synced device shown. No sync settings changed.
- Window Management enabled; inspected its native Create Layout editor and
  cancelled the draft. It supports app arguments and percentage sizes. Its editor
  is display-oriented; arbitrary multi-Space orchestration still needs validation.
- **27 installed third-party extensions**, listed below. Installation does not
  establish that each extension is authenticated or its commands work.
- DockFlow has `0. Default`, `1. Work`, `2. Code`, `3. Author`, `4. Create`,
  `6. Video`, `9. Zen`. Author's main tools are Safari, Claude and Obsidian.
- Zen **1.22b**, with two Firefox-profile names: `Default (release)` and
  `Default Profile`. The live menu calls its workspaces **Spaces**. Activity-named
  browser profiles have not been confirmed or created.
- Figma is installed. Affinity was not found among top-level `/Applications/*.app`.
- Existing Hyper maps include Karabiner application launches, Rectangle shortcut
  translations, Alfred hotkeys, and Codex-native voice, dictation and pet bindings.
- The unrelated local change to `codex/.codex/config.toml` is outside this migration.

Installed Raycast extensions:

1Password, App Cleaner, Brew, Clean Keyboard, Coffee, Color Picker, Downloads
Manager, Emoji Search, Ghostty, GitHub, Google Chrome, Google Translate, Google
Workspace, Kill Process, Linear, Messages, Mole, Pomodoro, Raycast Explorer,
Safari, Set Audio Device, Slack, Speedtest, System Monitor, Tailscale, Video
Downloader, YouTube.

## Modes and desktops

Each Mac has four ordinary desktops: **1 · Home** for Finder/support apps,
**2 · Connect** for browser/chat, **3 · Create** for AI/coding/creative tools,
**4 · Focus** for terminal, notes and focused work. These are Workmode role
labels; macOS retains Desktop 1–4.
Preserve the familiar Dock numbers.

| Mode | Meh key | Desktop 1 | Desktop 2 | Desktop 3 | Desktop 4 | Focus timer |
|---|---|---|---|---|---|---|
| Default | 0 | Finder | Zen maximized | Unchanged | Unchanged | None |
| Work | 1 | Support apps | Edge ⅔ + Teams ⅓ | Claude maximized | Work apps on demand | 30 min · Work |
| Code | 2 | Support apps | Zen ⅔ + Slack ⅓ | Amp maximized | Ghostty maximized | 45 min · Code |
| Author | 3 | Support apps | Zen maximized | Claude maximized | Obsidian maximized | 45 min · Author |
| Design | 4 | Support apps | Zen / Excalidraw maximized | Figma maximized | Affinity maximized | 45 min · Design |
| Innovate | 5 | Support apps | Zen ⅔ + Slack ⅓ | Codex maximized | Ghostty maximized | 45 min · Innovate |
| Video | 6 | Finder maximized | Unchanged | Final Cut Pro maximized | Motion maximized | 45 min · Video |
| Zen | 9 | Support apps | Zen maximized | Unchanged | Obsidian maximized | 25 min · Zen |

Code uses **Amp** by default; **Innovate** is the Codex alternative. Both include Zen, Ghostty and Slack. Telegram keeps its launcher
shortcut and does not replace Slack in layouts.

Author derives from the existing DockFlow preset, replacing Safari with Zen.
Default and Author must also stop launching Safari. Work retains Edge by explicit user choice. Chrome Canary remains
an optional end-to-end testing browser, outside normal mode layouts.

These are four ordinary macOS desktops, with maximized and tiled windows. Native
fullscreen/Split View creates separate Spaces and is not the foundation for these
repeatable arrangements. Use relative fractions so layouts fit both laptops.

For multiple monitors, bind desktop roles per device instead of saving this Mac's
screen IDs or pixel dimensions. Keep one-display behaviour as the portable default.

### Three different operations

1. **DockFlow Profile** (`df`, Meh+number): changes only the Dock. Preserve the
   existing meaning of the number shortcuts.
2. **Window Layout** (`wl`, Meh+Return): opens the mode apps, applies its DockFlow
   preset and arranges windows. Keeps unrelated apps running. Does not start a timer.
3. **Focus Session** (`fs`, proposed Meh+F): performs a preflight, quits unrelated
   regular apps normally, opens and arranges the mode apps, then starts Session.

The same mode definition drives all three. No independent app lists hidden in
Alfred, Raycast, DockFlow wrappers and the docs.

Focus must preserve the desktop shell, Raycast, DockFlow, Session and
accessory agents. It must allow save prompts, stop when quitting is cancelled,
and never force-kill an app. Missing apps/presets/desktops must be detected before
quitting anything. Display a preview of the apps that will be closed.

Raycast's layout option **Close Others** closes windows. It is not sufficient for
the requested policy of quitting unrelated applications. Retain the tested focus
lifecycle and replace its Rectangle/Alfred adapters with Raycast integration.

Repeated or concurrent commands must not race, start duplicate timers or create
duplicate browser tabs. Report partial failure and the failed step; do not claim
the layout succeeded merely because its deeplink opened.

## Keyboard ownership

Caps Lock held = **Hyper** (Control+Option+Command+Shift); tapped = Escape.
Raycast performs this conversion: Settings → Keyboard → Hyper Key → Caps Lock,
Include Shift on, Quick Press → Trigger Escape.
**Meh** is the physical Control+Option+Shift chord. Both Option keys and Right
Command stay normal. Raycast does not expose a second independent remapper in the
inspected settings. No Karabiner configuration is generated or installed.

### Apps: preserve the home-row muscle memory

| Hyper key | App | Reason |
|---|---|---|
| A | Amp, optional | Existing coding shortcut |
| S | Slack | Communication |
| D | Zen | Existing daily-browser shortcut |
| F | Finder | Files |
| H | Ghostty | Existing terminal shortcut |
| J | ChatGPT / Codex | Agentic work |
| K | Cursor | Code editor |
| L | Claude | Work, research and writing |
| G | T3 Code, optional | Existing secondary coding tool |
| R | Figma | Replaces Safari's now-free shortcut |
| U | Affinity, optional | Design tool near the right-hand home row |
| N | Obsidian | Notes and authoring |
| T | Telegram, optional | Shortcut only, outside session chat layouts |
| W / I / O / P | Word / Teams / Excel / PowerPoint | Preserve office bindings |
| Z / X / C | Final Cut Pro / Motion / Compressor, optional | Preserve existing media bindings |

Keep **Hyper+E** for Edge, used by Work. Apps remain searchable
by name in Raycast without spending a global shortcut.

Use native application commands for app activation, with exactly one Hyper key per
app. Use Quicklinks for websites, folders and resources. Creating an extra Quicklink
for every already-searchable app would duplicate search results.

Keep **Hyper+B** for the native Codex pet toggle, **Hyper+V** for Codex voice,
and **Hyper+M** for Codex dictation. Raycast must not intercept them.
Other Codex shortcuts retain their defaults. Do not add a second pet shortcut.

### Window management: Control+Option

The current recommendation preserves the native Rectangle-style preset:
Control+Option+D/F/G for thirds, E/T for two-thirds, arrows for halves, Return for
maximize, and minus/equals for resizing. Control+Option+comma/period is the new
previous/next Space pair, pending physical recording. Hyper remains the app layer.

See [the hotkey audit](raycast-hotkey-audit.md) for the full map, double-tap
recommendations and the distinction between saved intent and verified live settings.
Keep native Control+Left/Right for switching Spaces. Do not configure numbered or
physical-display shortcuts without checking their availability and ownership first.

### Meh: utilities and modes

| Key | Action |
|---|---|
| Option+Space | Raycast launcher |
| Command+Space | Spotlight |
| Hyper+Space | Workmode menu (`hk`) |
| Hyper+/ | Hotkey guide |
| Meh+0/1/2/3/4/5/6/9 | DockFlow Default / Work / Code / Author / Design / Innovate / Video / Zen |
| Meh+Return | Window Layout menu (`wl`) |
| Meh+F | Focus Session menu (`fs`), proposed addition |
| Meh+V | Raycast Clipboard History |
| Meh+S | Raycast Search Snippets |
| Meh+C | CleanShot X capture menu (`cs`) |
| Meh+Space | System Tools menu (`st`) |
| Meh+A | Selection actions, only after confirming the Raycast selection workflow |

Alfred Universal Actions has no assumed one-for-one Raycast equivalent. Check its
selection flow explicitly; fall back to a small selected-text/file action command
if needed. Do not silently turn Meh+A into an unrelated utility.

## Zen: browser contexts are a separate decision

Recommended: one browser profile with named **Spaces** for Work, Code, Innovate,
Author, Design and Zen. Containers can separate account cookies when needed;
Spaces alone group tabs, and containers do not isolate history or extensions.
Use full separate browser profiles only if that stronger separation is wanted.

An OS desktop, a DockFlow preset, a focus mode, a Zen Space and a Firefox profile
are different objects, even when their labels match. Document each explicitly.

Do not assume `-P Work` selects a Zen Space: it selects a Firefox profile. Native
launch arguments and named-Space switching must be validated on installed Zen.
If no reliable external Space-selection interface exists, provide a clearly named
manual Zen switch step rather than editing live browser state or promising that a
normal URL opens in the correct context. Existing logins and browser data stay local.

Excalidraw gets a Quicklink opening `https://excalidraw.com/` in Zen; the Design
context should pin it. Pin relevant public Workspace creation links in Work.
Never put private document links, account IDs, cookies or browser databases in Git.

## Replace workflows by capability

| Existing capability | Raycast replacement | Work needed |
|---|---|---|
| Launcher, file search, calculator, emoji | Native commands | Bind and test |
| Clipboard and snippets | Native commands | Migrate private content separately; never commit it |
| Rectangle fractions, maximize, restore, displays | Native Window Management | Transfer ownership and test |
| Session timers 20/25/30/45/60 | Custom Session Timer command (`ss`) | Use Session URL handler and named categories |
| Focus sessions and window layouts | Custom Workmode extension (`fs`, `wl`) | Preflight, quit lifecycle, DockFlow and Raycast layout adapters |
| DockFlow keywords and Meh numbers | Custom DockFlow command (`df`) | Resolve unique preset names, never machine-specific IDs |
| Google Workspace | Installed extension + Zen Quicklinks (`gw`) | Verify actual browser behaviour; avoid duplicate commands |
| Caffeine Dose | Installed Coffee extension | Verify duration, status and stop; retain native caffeinate fallback if necessary |
| Audio Switcher | Installed Set Audio Device | Input/output commands |
| atop / process management | System Monitor + Kill Process + System Actions | Keep kill actions deliberate; normal quit for focus |
| Homebrew, Git, network tests, translation, YouTube | Existing Brew, GitHub, Speedtest, translation, YouTube extensions | Configure aliases; verify command parity |
| Linear and Slack | Already installed extensions | Reuse, do not reimplement APIs |
| 1Password | Already installed extension | User handles any required authentication |
| CleanShot capture | Existing CleanShot X plus command menu | Preserve screenshot keys; no silent screen-access changes |
| Safari Control / Safari search | Exclude from new workflow defaults | No Safari mode or launcher binding |
| Chrome browser extension | Optional testing utility | Do not mistake Chrome support for Zen tab-search support |
| Browser tabs/bookmark search | Native Browser or a verified Zen-compatible extension | Compatibility test required |

Keep Raycast's built-in Focus and the installed Pomodoro extension available but
without competing timer hotkeys. Session remains the single timer used by `fs`
and `ss`. CleanShot remains the single assigned screenshot tool; Raycast Screenshots
can be assessed separately without assigning duplicate capture hotkeys.

## Source and distribution

Proposed repository structure:

```text
raycast/
  .config/raycast-workstation/
    workstation.json             # modes, app IDs, key ownership, timer categories
    quicklinks.json              # public links only
extensions/raycast-workstation/
  package.json + package-lock.json
  src/                          # Raycast-native commands and orchestration
  assets/
scripts/
  setup-raycast-workstation.mjs  # plan / apply / check / rollback
  test-raycast-workstation.mjs
docs/
  raycast-workstation.md         # operational guide after implementation
  raycast-workstation-plan.md    # this migration proposal
```

Do not Stow Raycast's databases or its generated extension runtime. Keep extension
source outside `~/.config/raycast/extensions`, which Raycast owns. Build/import the
local extension on each Mac using the documented development workflow. Raycast
documents that the imported extension remains after the development process stops.
Do not assume a personal Pro subscription includes private team extension hosting.

Cloud Sync already runs on this Mac. Native layouts, Quicklinks and extension
settings can use it, but script source and credentials do not sync. Local source
and setup commands therefore remain necessary. Verify locally developed extension
distribution instead of claiming Cloud Sync alone deploys its code.

Private exports are recovery files, excluded from Git by `*.rayconfig`. Preserve
Raycast's current data; avoid broad database extraction, overwriting synced content,
or blanket migration of credentials. Per-device permissions, app paths and displays
belong in local overrides, not shared defaults.

## Migration and new-Mac flow

1. **Inventory and backup.** Record hotkey owners, startup settings, installed
   extensions and live DockFlow names. Create a private Raycast export through its
   normal UI before hotkey changes. Record rollback references for managed files.
2. **Build alongside the current setup.** Add the shared config, Raycast extension,
   invariant tests and documentation. Keep production shortcuts unchanged initially.
3. **Prove one vertical slice.** Test Work Arrange using Edge + Teams; test Session's
   named timer separately. Verify real bounds and desktops, not only API success.
4. **Add all modes.** Derive Arrange and Focus from the same config; add missing-app,
   cancelled-save, missing-preset, duplicate-invocation and layout-failure tests.
5. **Cut over hotkeys.** Remove competing Alfred/Rectangle mappings, activate
   Raycast application/window shortcuts. Keep Raycast on Option+Space and restore
   Spotlight on Command+Space; clear any competing Alfred launcher shortcut.
   Keep a recovery path that does not depend on Hyper working.
6. **Switch startup.** Raycast and required support apps start at login.
   Disable Karabiner/Alfred/Rectangle startup after validation. Do not uninstall them as the
   first migration step. Do not automatically stop app sessions with unsaved work.
7. **Update portable setup.** One opt-in productivity installer and one checklist
   replace the divergent FDE/TF productivity guides. Preserve core-only installation.
   Install Raycast and suitable mode apps through Homebrew. Do not install or Stow
   Karabiner, Alfred or Rectangle Pro. No automatic Affinity purchase/license.
8. **Validate the second Mac.** Clone, plan, install dependencies, Stow only curated
   config, build/import extension, sign in to existing Raycast Pro, then complete
   local permissions, Session categories, DockFlow import and Zen-context setup.
9. **Publish after checks.** Feature PR to `main`, squash merge. No `dev` branch.

User-managed steps must be explicit: licenses/sign-ins, macOS access prompts,
Session categories, Zen context/container decisions, DockFlow preset content, and
per-Mac desktop/display assignments. The installer opens the GitHub checklist at
the relevant section and clearly reports what remains.

The user plans to update DockFlow. Export and sanitize the final presets afterwards;
do not replace their live preset changes from the old repository snapshot. Until
Design and Innovate exist with unique names, commands must report the missing
presets before quitting apps or starting timers.

## Acceptance and rollback

| Check | Pass condition |
|---|---|
| Modifiers | Raycast Caps tap Escape, hold Hyper; physical Meh chord; Right Option/Command normal |
| Keys | One owner per chord; one Hyper shortcut per app; Codex B/V/M preserved |
| Dock | Every mode resolves exactly one live preset; no accidental duplicate import |
| Arrange | Correct Dock and window bounds; unrelated app remains open; no timer |
| Focus | Target apps only plus support agents; save-cancel aborts; one named timer after successful layout |
| Browser | Non-Work links use Zen, Work uses Edge; context verified; no Safari launch |
| Displays | Fractions and desktop role routing work on laptop and external display |
| Failure | Missing app/preset/desktop/Pro access leaves existing apps untouched |
| Restart | Expected apps start; Karabiner/Alfred/Rectangle no longer intercept assigned keys |
| Portability | Clean-home plan/apply/check/rollback tests pass; no credentials, runtime DBs or host screen IDs in Git |

Automated tests are necessary but do not prove physical hotkey behaviour or app
permissions. The existing computer-use connection denied direct Ghostty control;
do not route around that denial to claim an end-to-end live Code-session test.
Ghostty layout and physical shortcut acceptance may require the user's check.

Rollback must restore only files/settings changed by this migration, with hashes
to avoid overwriting later user edits. Disable the new command hotkeys before
re-enabling Alfred/Rectangle. Do not delete Raycast Cloud Sync data or browser
profiles during rollback. Quitting apps is not fully reversible: recovery should
not claim to restore unsaved application state.

## Sources

- [Raycast native Hyper Key](https://manual.raycast.com/hyper-key): native remapping, Shift and tap Escape; conflicts with other remappers.
- [Raycast Dock extension](https://www.raycast.com/pradeepb28/dock): changes Dock position, not saved Dock contents.

- [Raycast Window Management](https://manual.raycast.com/window-management): native commands, layouts, app arguments, Close Others and limitations.
- [Window Management API](https://developers.raycast.com/api-reference/window-management): Pro access, active-desktop window enumeration, desktop IDs and bounds.
- [Raycast Cloud Sync](https://manual.raycast.com/cloud-sync): synced categories and local-only scripts/credentials.
- [Create Your First Extension](https://developers.raycast.com/basics/create-your-first-extension): local development/import lifecycle.
- [Raycast Script Commands](https://manual.raycast.com/script-commands): source directory registration and command lifecycle.
- [Command Aliases and Hotkeys](https://manual.raycast.com/command-aliases-and-hotkeys): command-level shortcut ownership.
- [Zen Workspaces](https://docs.zen-browser.app/user-manual/workspaces): workspace/container distinction and shared history/extensions.
- [Zen profile management](https://docs.zen-browser.app/guides/manage-profiles): separate browser profiles.

Live observations above came from the installed app UIs and public application
metadata. No browser histories, Raycast databases, private exports or credentials
were read for this proposal.

See the complete [2–4 character alias guide](raycast-aliases.md) for apps, windows, utilities and Dock profiles.
