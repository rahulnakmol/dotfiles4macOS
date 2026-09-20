# FDE — Full developer environment

Install the FDE core apps and configuration on this Mac. Automation is optional: choose Raycast Workmode or Alfred with Karabiner and Rectangle Pro. The sections below describe core setup and the Alfred option. Raycast has its own shared guide and modes.

## Quick setup

From a checkout, run one command:

```sh
bash install.sh --profile fde
```

Choose your automation after installing the core:

| Choice | What to do |
| --- | --- |
| Core only | Keep the command above; skip the productivity sections. |
| Raycast Workmode | Leave --productivity off. Follow https://github.com/rahulnakmol/dotfiles4macOS/blob/main/docs/guides/raycast.md for installation, Spaces, categories and shortcuts. |
| Alfred + Karabiner + Rectangle Pro | Add --productivity. Follow https://github.com/rahulnakmol/dotfiles4macOS/blob/main/docs/guides/alfred.md and the profile details below. |

For a fresh Mac or double-click launchers, see https://github.com/rahulnakmol/dotfiles4macOS/blob/main/docs/setup-profiles.md. The installer checks prerequisites, runs plan/apply/check, records progress and opens this GitHub manual. Rerun after completing any interrupted Apple installation. Existing checkouts are used as-is.

## Finish setup human checklist

Managed installation and human setup are tracked separately. These steps are unverified until you perform the checks below; setup does not collect credentials or record a checkbox as proof.

| Step | What you do | How to verify |
| --- | --- | --- |
| Default browser | Complete Zen onboarding; choose Zen under Default web browser in macOS System Settings | Open an ordinary web link and confirm it opens in Zen |
| Desktop apps | Complete your own app sign-ins; configure a provider in T3 Code if using it | Start your own small task in each app |
| Core configuration | Open a new terminal; check prompt, fonts and editor | Run the profile check command and confirm no managed drift |
| Private AI gateway (CLI only) | Run the gateway setup once for Claude Code, Codex and OpenCode | Run the value-free status command and check Herdr integrations |
| Optional productivity only | Follow Complete the apps on each Mac below | Re-run check with --productivity; then perform the native checks below |
| Karabiner | Download official DMG, install PKG, complete macOS services/driver/input prompts | Caps Lock+F opens Finder; a tap sends Escape |
| Alfred and Rectangle | Activate licenses, set Alfred preferences folder, grant requested Accessibility, import Rectangle snapshot | Command+Space opens Alfred; wl applies the expected layout |
| DockFlow | Import this profile's preset pack; resolve duplicate names | dp selects the expected Dock profile |
| Session | Install the correct app, enable Pro URL automation and create Work and Code categories | A real session shows the right category and countdown |
| Desktops | Assign apps to the numbered desktops as documented below | Zen, coding app and terminal/chat appear on Desktops 1, 2 and 3 |
| CleanShot and login | Complete capture permission and external-control prompts; enable utility startup | Capture works; utilities and shortcuts work after login |
| Codex pet (optional) | In Codex keyboard settings set Show pet to Hyper+B (replaces Option+Space) | While Codex runs, Hyper+B shows the pet; press again to hide it |

For core-only or Raycast setup, skip the Alfred productivity rows below. Raycast users should use its own per-Mac checklist after completing the core rows. The installer does not grant permissions, activate licenses, run focus sessions, close apps or verify personal account access. Keep the printed backup path for rollback. Detailed instructions follow; the final Verification and troubleshooting section has the acceptance checks.

## Start on a new Mac

1. Install Apple Command Line Tools (xcode-select --install), then Homebrew from https://brew.sh. This setup targets Apple Silicon; optional Amp requires macOS 26 or later; it is not a prerequisite for FDE.
2. Install Git, Node and Stow, then clone your dotfiles fork into ~/.dotfiles. Do not clone someone else's private credentials or signing files.
3. Preview the selected profile, then apply it. Existing real files or unrelated symlinks are reported as conflicts before any installation. Move your conflicting configuration to a private backup yourself, compare it, and rerun; never use Stow adopt blindly.

```sh
brew install git node stow
cd ~/.dotfiles
bash scripts/setup-workstation.sh plan --profile fde
bash scripts/setup-workstation.sh apply --profile fde
bash scripts/setup-workstation.sh check --profile fde
```

Without --profile, an interactive terminal offers FDE / TF on first use. Later runs use the locally selected profile. Apply installs only missing packages and prints a backup path. Repeat apply after updates; it will refuse to overwrite edits made to managed generated files.

## Configure the private AI gateway once per user

The profile installs Claude Code, Codex, OpenCode and Herdr, but never collects a credential. After
the profile apply, configure the CLI tools interactively:

```sh
bash scripts/setup-private-ai-gateway.sh
bash scripts/setup-private-ai-gateway.sh --status
herdr integration status
```

Setup prompts for a vendor-neutral HTTPS endpoint, silently reads one key, fetches the authenticated
`/v1/models` catalog, and asks for the Codex/OpenCode default. Endpoint, shared key and model remain
under `~/.config/private-ai-gateway` with restrictive permissions. Ordinary `claude`, `codex`
and `opencode` commands use protected wrappers in `~/.local/bin`; desktop applications remain
unchanged. Re-run setup to refresh models, or use `--rotate-key` for one-place key rotation.

Cursor CLI stays on the official Cursor account because it has no generic OpenAI-compatible provider
interface. Never reuse the gateway key as `CURSOR_API_KEY`. See the module guides for details.

## Optional Alfred productivity setup

The default commands above install the role apps and CLI toolkit and Stow shell, terminal and editor settings only. They do not install Alfred, Rectangle Pro, DockFlow or CleanShot, request Karabiner/Session setup, generate their workflows, change launcher hotkeys, or link their settings.

To opt in, add --productivity to each command:

```sh
bash scripts/setup-workstation.sh plan --profile fde --productivity
bash scripts/setup-workstation.sh apply --profile fde --productivity
bash scripts/setup-workstation.sh check --profile fde --productivity
```

This adds Alfred, Karabiner, Rectangle Pro, DockFlow, Session timers, focus sessions, window layouts, Google Workspace workflows and CleanShot integration. Karabiner and Session still require the guided installation below. Enabling the option does not start a focus session or quit apps.

The flag is required on every run that manages productivity; a previous opt-in does not silently enable it later. Omitting it leaves existing productivity apps, links and preferences untouched, including during a profile switch. It does not uninstall or disable a previously configured setup. Core check deliberately skips productivity dependencies and permissions. Use the backup from the opt-in run to roll back its managed settings.

## What is installed

General CLI tools are shared: git, node, stow, zsh, tmux, herdr, neovim, eza, bat, fd, ripgrep, fzf, zoxide, starship, curl, jq, gh, podman, claude, opencode, zsh-autosuggestions, zsh-syntax-highlighting, zsh-autocomplete. Shell, prompt, terminal and editor modules are Stow-managed. Default Homebrew GUI packages: font-jetbrains-mono-nerd-font, ghostty, zen, microsoft-edge, microsoft-teams, claude, obsidian, cursor, chatgpt, slack, t3-code, microsoft-word, microsoft-excel, microsoft-powerpoint. Safari and Finder are built into macOS. Licensed media apps are never automatically installed.

FDE keeps Amp, Claude, Cursor and T3 Code variations and the full app map; Amp is optional and only its own workflow requires it. Existing Claude/Codex/Cursor/OpenCode configuration modules remain available in the repository; agent trust/auth settings are an explicit personal setup step, not copied to colleagues by this installer.

Git and gh are installed, but personal Git identity, SSH, signing and credential configuration are retained on this Mac and never copied from the repository. Set up your own identity and account separately. No authentication or license information is included in either profile.

## Default apps and browser setup

Both profiles install Zen Browser, Claude Desktop, Cursor and ChatGPT/Codex by default. Zen is the everyday browser for code sessions. Work keeps Microsoft Edge. Stable Google Chrome is not installed by the setup.

1. Open Zen once to complete its onboarding. In macOS System Settings, search for Default web browser and select Zen. This is a human step on each Mac; Stow does not set the OS default browser. Google Workspace links use that OS default.
2. If you previously used Chrome for code, assign Zen to the reference desktop, rerun apply with --productivity and reimport Rectangle Pro and the DockFlow preset pack. Resolve duplicate preset names before testing. Existing Chrome installations and browser data are retained.
3. Optional end-to-end testing browser: install Google Chrome Canary with the command below. Launch it by name in Alfred when testing; it is not part of focus-session layouts or the default install. Use the Canary app explicitly in your test runner configuration; this setup does not change browser binaries managed by Playwright or other test tools.

```sh
brew install --cask google-chrome@canary
```

Official casks: https://formulae.brew.sh/cask/zen and https://formulae.brew.sh/cask/google-chrome%40canary.

FDE additionally installs T3 Code via brew install --cask t3-code. It uses at least one separately configured provider CLI; opening the desktop app alone does not configure a provider. Follow https://github.com/pingdotgg/t3code/blob/main/docs/user/install.md for provider prerequisites. Hyper+G opens T3 Code; Hyper+J still opens ChatGPT/Codex. Telegram is shortcut-only on Hyper+T: optionally install it with brew install --cask telegram. It is not included in focus sessions or Dock presets.

Amp is an optional native app from https://ampcode.com/app. Install it only if needed; the installer and check command do not require it. FDE retains Hyper+A and Code + Amp for users who install it. Its macOS 26+ requirement applies only to Amp, not to the base profile. TF does not include Amp workflows.

## Productivity: Karabiner official installer

Everything from this section through the workflow reference is optional and requires --productivity. Without it, keep your preferred launcher, shortcuts and window manager. Amp is optional: install its native app separately from https://ampcode.com/app only if you want its workflow.

1. Visit https://karabiner-elements.pqrs.org/ and download the stable DMG suitable for your macOS version. The setup command prints this link when it is missing.
2. Open the DMG, then Karabiner-Elements.pkg. Complete macOS Installer and enter administrator credentials directly.
3. Launch Karabiner-Elements. Complete the background-service, driver extension and input/accessibility prompts shown by that version. Choose the physical keyboard type (ANSI / ISO / JIS).
4. Select Hyperland. Hold Caps Lock and press F: Finder should open. Tap Caps Lock: Escape should be sent. Hold Right Option and press Return: Alfred's layouts should appear.
5. Restart or log out when prompted, then repeat the physical tests. An app icon or old Homebrew receipt is not proof that the driver works.

Karabiner is deliberately excluded from Homebrew installation. An existing healthy install is retained; a broken Homebrew install needs the vendor's uninstall/reinstall guidance rather than deleting driver files. The entire ~/.config/karabiner directory is linked, so Karabiner can observe changes; its JSON file alone must not be symlinked.

## Complete the apps on each Mac

1. Alfred: activate Powerpack; Advanced → Set preferences folder → ~/.config/alfred. Restart Alfred. Rerun apply with --productivity to set this machine's Command+Space launcher and Meh feature keys. Disable Spotlight's Command+Space and any Raycast launcher/Hyper bindings that overlap.
2. Rectangle Pro: activate, grant Accessibility, enable login, then App Settings → Import Config → ~/.config/rectangle-pro/RectangleProConfig.json. Repeat this import after changing profiles or updating layouts; Stow alone does not apply native Rectangle settings.
3. Session: install the focus timer from https://www.stayinsession.com/ or Setapp. Activate Pro URL automation, enable login and review breathing/break settings. Complete the Session categories checklist below before using focus sessions. Do not install the Homebrew session cask: it is an unrelated messenger.
4. Optional Amp: install the native Mac app from https://ampcode.com/app. The CLI alone does not satisfy the Amp window layout. Sign in directly in the app.
5. DockFlow: activate, enable login, and import the preset pack described below. Leave its automatic app quit/launch actions off; Alfred owns focus orchestration and Rectangle owns window geometry.
6. CleanShot X: an existing Setapp copy is accepted. Otherwise install/activate the standalone app. Enable login, grant capture permission, and configure Command+Shift+3/4/5 in CleanShot. Approve its external-command prompt when you first use the capture menu.
7. Install the utility workflows from Alfred Gallery using the links below. Keep their default keywords. Their credentials, settings, snippets and history stay local.

| Workflow | Install from |
| --- | --- |
| atop | https://alfred.app/workflows/chrisgrieser/atop/ |
| Audio Switcher | https://alfred.app/workflows/tobiasmende/audio-switcher/ |
| Caffeine Dose | https://alfred.app/workflows/vanstrouble/caffeine-dose/ |
| Timer | https://alfred.app/workflows/colomolo/timer/ |

Owned Hyper, DockFlow Profiles and Google Workspace workflows are generated automatically, with author Rahul N Akmol and icons. Third-party workflows keep their own authors and names. Their existing installations are retained in that profile's private preferences bundle.

## Session categories — human setup

This checklist is part of optional productivity setup only. Create these categories in Session once, then verify they are available on each Mac. Reuse existing matching categories instead of creating duplicates.

| Category | Use for |
| --- | --- |
| Work | fs work |
| Code | fs amp, fs claude, fs cursor and fs t3code |

1. Open Session's main timer screen. In the intention field, type @ to open category selection and use its add-category option for each name above. Choose any colors you prefer.
2. Reopen category selection and confirm each category is available. On another Mac, check for existing categories first and create only missing ones.
3. Select the appropriate category before starting a standalone ss timer. Focus sessions select the mapped category automatically. The category groups time by activity; the intention describes the task. Pomodoro is a timer duration/style, so choose Work or Code according to the task rather than creating a required Pomodoro category.
4. After your first real session, check its category in Session's history. Repeat for each category so you can confirm time is grouped correctly.

Focus workflows (fs) automatically pass categoryName using the mapping above, alongside intention and duration. Standalone timers (ss) keep your selected/default category because they are not tied to a profile activity. Session matches category names case-insensitively, does not create categories, and falls back to the default when no match exists. Create the categories before your first focus session and verify the category on its timer. Category data lives in Session, not in Stow or the dotfiles backup.

Session references: category creation with @ at https://stayinsession.com/changelog and categoryName behavior at https://www.stayinsession.com/learn/session-url-scheme.

## Four desktops and working Spaces

Create four desktops in Mission Control. Then run the existing helper:

```sh
bash scripts/setup-hyper-macos.sh plan
bash scripts/setup-hyper-macos.sh apply
bash scripts/setup-hyper-macos.sh check
```

Log out and back in after changing Mission Control settings. In each app's Dock icon → Options → Assign To → This Desktop, assign Zen Browser, Obsidian, Edge and Teams to Desktop 1; Claude, Cursor and T3 Code (plus Amp if installed) to Desktop 2; Ghostty and Slack to Desktop 3. Desktop 4 stays available. Existing assignments are respected, never recreated by window-title matching. Native fullscreen creates separate Spaces; these workflows use maximized and tiled ordinary windows.

Code arrangement:

```text
Desktop 1: [ Zen Browser maximized                       ]
Desktop 2: [ Amp / Claude / Cursor / T3 Code maximized    ]
Desktop 3: [ Ghostty                    2/3 ][ Slack 1/3 ]
Desktop 4: available for other tasks
```

Work uses Edge 2/3 + Teams 1/3. Every Code variant uses three working desktops: Zen maximized, the coding app maximized, and Ghostty 2/3 + Slack 1/3. Move Ghostty from Desktop 1 to Desktop 3 once on each Mac. These are virtual desktops, not three required physical monitors. T3 Code replaces the FDE Codex session; TF retains Innovate + Codex. Obsidian remains available in the separate Code Notes and Zen layouts. Amp sessions require the optional Amp app.

On small displays Teams may refuse a narrow third. Choose Work Balanced or use Hyper+Return to maximize. Extra app windows may need manual placement. Exact native fullscreen Split View recreation is not part of this setup.

## Commands and hotkeys

See the [Alfred FDE hotkey reference](../../modules/alfred-fde-hotkeys.md) for app keys, window actions, layouts, focus sessions and timers.

## Import and export DockFlow

1. In DockFlow → Settings → Backup & Restore → Export Backup, export your existing presets privately before importing anything. Leave Include folders off for shared packs.
2. Import ~/.dotfiles/dockflow/presets/fde.json. Select the presets for this setup. Imports add presets; they do not replace existing ones automatically.
3. Ensure exactly one preset has each name in the table above. If you already have a same-named preset, rename the old one (for example Saved Work) before importing. Do not repeatedly import the same pack.
4. Verify apps were resolved on this Mac, and app-opening/quitting actions remain off. The export packs contain no private folders, browser profiles, account data or custom launch actions.
5. Test dp work and dp code. Name-based selection discovers the current preset rather than reusing another Mac's IDs. Duplicate/missing names produce an actionable error.
6. To share later edits, export selected presets without folders to a private temporary location. Use scripts/sanitize-dockflow.mjs to create a sanitized export, review the diff, then commit the pack. Never Stow DockFlow's live database.

FDE has seven presets; TF has Default, Work, Code, Innovate and Zen. Switching an existing FDE Mac to TF hides extra presets in Alfred but leaves the saved DockFlow library intact. Rename/archive old presets manually if desired. Export JSON uses DockFlow's native schema, not a made-up format.

## Updates, profile switching and rollback

After pulling reviewed changes, rerun plan, apply and check with the same profile. Include --productivity only when you want to update the optional automation setup. Profile-generated source lives under ~/.local/share/dotfiles/workstations/fde; ~/.config links are managed by GNU Stow. Source definitions, exports and this documentation are versioned in dotfiles. Histories, local preferences and generated activation journals stay on this Mac.

To switch core settings, run apply --profile tf. Add --productivity to switch the automation settings as well. Only links owned by this checkout or its managed profile folders may be replaced. Other files cause a conflict. Each profile keeps its own Alfred preferences and third-party workflows; switching back restores access to its previous preferences. On the first migration from the legacy dotfiles Alfred folder, that folder remains intact; select/install the needed utility workflows in the new profile. No private workflow variables or histories are copied automatically.

After switching productivity profiles, reconnect Alfred to ~/.config/alfred and restart it, import the new Rectangle snapshot and chosen DockFlow pack, then run check with --productivity. Check reports machine-local steps as unverified until physically tested; it never equates file correctness with permissions or a login test.

```sh
bash scripts/setup-workstation.sh rollback BACKUP_DIRECTORY
```

Rollback restores managed files, links, profile selection and narrowly managed Alfred fields for that run. It retains installed applications and personal data. Later edits cause rollback to stop rather than overwrite them. Restore Rectangle from its previous native export and DockFlow from your private backup separately; OS permissions, accounts and licenses are not reversed. Mission Control has its own backup/rollback command.

## Verification and troubleshooting

For the default setup, check validates only core settings and role apps. The following checks apply after opting into productivity.

1. check --productivity must report no file/link drift, missing packages, required apps or preset names. Complete any remaining guided requirements.
2. Test physical Caps Lock, Right Option, application launch keys, the four desktop shortcuts, and Meh numbers.
3. Test wl work and wl Code Cursor; windows should land on their assigned desktops. If they land elsewhere, repair native Dock assignments and ensure automatic Space rearrangement is disabled.
4. With work saved, test fs work (30 minutes) and fs cursor (45); test fs amp only when Amp is installed. Resolve prompts; verify the countdown in Session. Check unrelated apps closed and support tools stayed open.
5. Verify Alfred, Rectangle, DockFlow, Session and CleanShot after a logout/login. Repeat on Air and Pro, and with an external display. Report physical checks separately from automated tests.

Missing Alfred menus: select the right preferences folder and restart. Missing utility: install its Gallery workflow. Missing layout: reimport Rectangle snapshot. Wrong Dock: inspect duplicate preset names. No Hyper: complete Karabiner services/driver permissions and check the selected profile. Timer absent: verify the correct Session app and Pro automation. There is no automated license activation.
