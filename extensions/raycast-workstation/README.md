# Workmode

Created by **Rahul N Akmol**. One optional Raycast Pro productivity setup for macOS.

## Commands

| Command | Suggested alias | Effect |
|---|---|---|
| Workmode | `hk` | All modes and actions |
| Window Layout | `wl` | Open and arrange mode apps; apply DockFlow; keep other apps |
| Focus Session | `fs` | Preflight, preview normal app quits, arrange, request a Session timer |
| DockFlow Profile | `df` | Change Dock only |
| Session Timer | `ss` | 20, 25, 30, 45 or 60 minutes; category actions in the action panel |
| Check Workmode Setup | `wchk` | App/preset checks and explicit local desktop mapping |
| Capture | `cs` | CleanShot X actions |
| Google Workspace | `gw` | Public creation links in Zen; includes Excalidraw |

Work uses Edge + Teams + Claude. Code uses Zen + Amp + Ghostty + Slack.
Innovate swaps Amp for Codex. Author uses Zen + Claude + Obsidian. Design uses
Zen + Figma + Affinity. Zen uses Zen + Obsidian. Video uses Final Cut Pro + Motion
+ Finder. Default arranges Zen without a timer. Use `fco` / `wco` for Amp and `fin` / `win` for Codex. T3 Code is not a session or layout option. Single-app hotkeys belong to Raycast Applications; Quicklinks cover
URLs, folders and specific destinations. Optional app keys stay reserved until
the app is installed. Optional apps are not automatically installed: a mode requiring a missing
app fails its preflight before closing anything.

## Install on macOS

From the dotfiles checkout:

```sh
bash scripts/setup-raycast-workstation.sh install
```

Or double-click `setup/Raycast.command`. Both use the same installer. Install
Node 22.18+, npm and GNU Stow first (`brew install node stow`), plus Xcode Command
Line Tools (`xcode-select --install`) and Raycast (`brew install --cask raycast`).
Sign in to Raycast yourself if prompted. Window layouts/focus require Raycast Pro.
Install DockFlow, Session and only the apps required by the modes you use.

The command installs locked dependencies, compiles the Swift helper for this Mac,
runs tests/typechecking/build validation, Stows the curated config, then imports
with `ray develop`. After “Importing Workmode”, wait for **ready**, then press **Control+C**. The extension stays installed;
there is no background development process to keep running. Repeat `install`
after pulling updates. A failed import can be retried; the linked config remains.

```sh
bash scripts/setup-raycast-workstation.sh plan      # no changes
bash scripts/setup-raycast-workstation.sh build     # no Stow or import
bash scripts/setup-raycast-workstation.sh check     # source + local link checks
bash scripts/setup-raycast-workstation.sh rollback  # unlink config only
```

`apply` remains a prepare-only compatibility command. `npm run build` alone does
not install the extension. For source edits after setup, use `npm run dev` from
this directory. Regenerate config with `node scripts/build-raycast-keymap.mjs`
from the repo root when changing aliases/keys, then rerun `install`.

The source configuration is `raycast/.config/raycast-workstation/workstation.json`;
the build copies it into bundled assets. Native Raycast settings are separate;
Stow never links its databases. This setup is opt-in for both FDE and TF and
rejects non-macOS hosts. No apps, accounts, permissions or login items are
configured by the source installer.

Follow the [per-Mac checklist](../../docs/raycast-workstation.md#install) and
[aliases](../../docs/raycast-aliases.md). To disable Workmode, remove the extension
in Raycast Settings as well as running rollback; unlinking alone leaves bundled
defaults available. Session/DockFlow data and private Raycast settings remain.

References: [Raycast prerequisites](https://developers.raycast.com/basics/getting-started),
[local install](https://developers.raycast.com/basics/create-your-first-extension),
[contributing](https://developers.raycast.com/basics/contribute-to-an-extension),
[CLI build versus import](https://developers.raycast.com/information/developer-tools/cli).

## Small by design

Workmode coordinates layouts, normal quits, Dock profiles and categorized timers.
Raycast owns app launching, Hyper, window hotkeys, clipboard and Quicklinks.
Capture and web menus are small URL dispatchers. The direct mode commands are
thin entry points into one implementation, retained for the requested aliases.
There is one mode list, no plugin framework, custom scheduler or daemon. Keep
new integrations out until a concrete workflow needs them. See the
[decision and trade-offs](../../docs/adr/0005-workmode-local-install.md).

## Per-Mac setup

Create four desktops in Mission Control. On each desktop, run `wchk`, select
its number and choose **Assign This Space to Desktop N**. Desktop roles are
**1 · Home** (Finder/support apps), **2 · Connect** (browser/chat), **3 · Create**
(AI/coding/creative tools), and **4 · Focus** (terminal/notes/work apps). These labels
do not rename macOS Spaces. Open Raycast with **Option+Space**; keep
**Command+Space** for Spotlight.
Repeat on each Mac or after recreating desktops. Local IDs are stored only in
Raycast's support directory. Focus an app on the intended display before assigning.

Raycast owns native Caps Lock Hyper, launching and window management. No Karabiner,
Alfred or Rectangle Pro is required. Enable Include Shift and quick-press Escape
in Raycast Keyboard settings. Meh means the physical Control+Option+Shift chord;
Right Option is not independently remapped. Keep Session for focus timers and
DockFlow for saved Dock contents. Native Raycast layouts arrange windows, while
DockFlow's integration changes which apps and folders appear in the macOS Dock.

## Before first focus session

Create matching Session categories: Work, Code, Innovate, Author, Design, Zen,
Video. Create/import uniquely named DockFlow presets listed in workstation.json.
Resolve missing apps and native fullscreen windows. Confirm Zen's intended Space
manually for now; the extension does not claim to switch browser identities.

Focus honours normal save/quit prompts. Cancelling or timing out stops the switch.
The extension does not force-kill processes. A timer URL request is not proof that
Session dismissed a previous-timer prompt; handle any Session prompt yourself.

If a process crashes during switching, the local `switch.lock` can remain. Check
that no switch is running before removing that file at the path in the error.
Do not remove the lock while a save prompt is still pending.

## Validation

```sh
npm test
npm run typecheck
npm run build
```

Tests use a fake desktop; they never quit your applications. Native import, actual
window bounds, fullscreen restrictions, multiple monitors and physical hotkeys
need live acceptance. See `docs/raycast-workstation.md` and the research plan in
the parent dotfiles repository.

See the complete [2–4 character alias guide](../../docs/raycast-aliases.md) for apps, windows, utilities, Dock profiles and direct layout/focus modes.

Direct aliases such as `wco` and `fco` open only Code. Layouts then offer Arrange;
focus sessions retain their preview and explicit Start Focus confirmation.
All 17 direct aliases were checked live for correct routing on 13 September 2026.
