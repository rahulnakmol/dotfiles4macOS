# Codex on macOS — GNU Stow

The actual Codex configuration lives in `codex/.codex/config.toml`. Edit that
file directly, just like `claude/.claude/settings.json`. GNU Stow links it to
`~/.codex/config.toml`; there is no separate preferences file or config merge step.

## Subscription and private-gateway profiles

The tracked `codex/.codex` module remains the subscription/default ChatGPT desktop profile at
`~/.codex`. The selective `codex-aigateway` module supplies only reviewed policy, instructions,
hooks and keybindings for the separate real `~/.codex-aigateway` home. Its machine-local generated
provider uses the OpenAI Responses wire API and file-backed authentication through the one shared
mode-0600 key at `~/.config/private-ai-gateway/client.key`. After gateway setup, ordinary terminal
`codex` remains gateway-backed independently of the selected desktop mode. Explicit launchers open
subscription and gateway desktop instances concurrently when `both` is selected.

Gateway authentication and Codex desktop-profile selection are deliberately
separate. Terminal Codex is always gateway-backed, so prepare and validate the
gateway first for every desktop mode; then choose the Codex home layout. Gateway
setup automatically deploys the reviewed Claude and OpenCode Stow modules. Do
not run `stow codex` separately: the profile installer owns that migration and
waits for it to finish before creating subscription launchers.

```bash
# Required for terminal Codex: prompts for endpoint/key and validates all APIs
bash scripts/setup-private-ai-gateway.sh

# Select desktop/home layout; this never asks for or rotates the gateway key
bash scripts/setup-codex-profiles.sh --mode subscription  # one ~/.codex home
bash scripts/setup-codex-profiles.sh --mode gateway       # one ~/.codex home
bash scripts/setup-codex-profiles.sh --mode both          # ~/.codex + ~/.codex-aigateway
```

If gateway configuration is absent in any mode, an interactive run offers to
start the separate gateway setup and resumes only after it succeeds. A
non-interactive run stops with the exact command to run first. Profile setup holds
a per-user lock while moving homes, so a second run fails clearly rather than
racing `~/.codex`. Subscription and both modes run the reviewed Codex Stow
migration synchronously and verify every managed link before creating launchers.

### Choose the desktop profiles

| Route | Shell command | Raycast command | Codex home | Authentication |
| --- | --- | --- | --- | --- |
| Subscription desktop | `cxs` | **ChatGPT — Subscription** | `~/.codex` | Normal ChatGPT subscription sign-in |
| Gateway desktop — gateway-only mode | `cxg` | **ChatGPT — AI Gateway** | `~/.codex` | File-backed gateway key |
| Gateway desktop — both mode | `cxg` | **ChatGPT — AI Gateway** | `~/.codex-aigateway` | File-backed gateway key |
| Selected single desktop route | `cx` | — | `~/.codex` | Selected mode; refuses to guess in `both` mode |
| Gateway CLI | `codex` | — | Active gateway home for the selected mode | File-backed gateway key |

The two signed desktop processes can run concurrently with separate Codex and
Electron state. They retain the same `com.openai.codex` bundle ID, app name and
icon, so generic Dock, app-switcher, Hyper+J and Raycast actions cannot select a
profile reliably. Use the explicit Script Commands or `cxs` and `cxg`.

### Assign separate launch shortcuts

Profile setup Stows both Script Commands, even when the selected mode enables only
one route. Add `~/.config/raycast/scripts` once under **Raycast Settings →
Extensions → Script Commands**. Then confirm the enabled shell routes:

```bash
cxs # subscription; enabled in subscription or both mode
cxg # gateway; enabled in gateway or both mode
cx  # selected single route; deliberately refuses in both mode
```

Then expose those **commands**, rather than the ChatGPT application, through one
launcher. Choose only the section matching your productivity setup; do not assign
the same global chords in Raycast, Alfred and macOS Shortcuts.

#### Raycast

The repository already provides official-format [Script Commands](https://developers.raycast.com/information/lifecycle/scripts)
at `~/.config/raycast/scripts/codex/`. Search for **ChatGPT — Subscription** and
**ChatGPT — AI Gateway**, then assign unused hotkeys in Raycast Settings. Do not
use Raycast's ordinary **Open Application** action; it sees only the shared bundle
ID. Repeated hotkey presses are suppressed briefly, and stale launch locks recover
automatically.

#### Alfred

Create one private workflow with two paths:

```text
Keyword or Hotkey → Run Script: source ~/.zshrc; cxs
Keyword or Hotkey → Run Script: source ~/.zshrc; cxg
```

Use `/bin/zsh` or `/bin/bash` for each **Run Script** action. Suggested keywords
are `cxs` and `cxg`; assign unused hotkeys only after checking the
[Alfred map](alfred.md#hotkeys-and-commands). Keep this workflow private because
Alfred exports can contain machine-local metadata. Do not use an Alfred **Launch
Apps / Files** object for these routes—the application identity is ambiguous.

#### macOS Shortcuts

For a launcher-independent option, create two shortcuts. Add a **Run Shell
Script** action to each and use:

```bash
source "$HOME/.zshrc"
cxs
```

and:

```bash
source "$HOME/.zshrc"
cxg
```

Name them **ChatGPT — Subscription** and **ChatGPT — AI Gateway**, then assign
unused keyboard shortcuts in each shortcut's details. This remains a local macOS
preference and is intentionally not stored in the public dotfiles repository.

#### Verify the routes

1. Run the subscription route and confirm it opens the profile signed into the
   ChatGPT subscription.
2. Run the gateway route and confirm its model/provider state belongs to the
   isolated gateway profile.
3. Launch them in the opposite order and repeat the checks.
4. With both running, invoke each shortcut again and confirm the intended window
   is opened or focused. If the launcher cannot distinguish them, use the terminal
   commands and rerun `bash scripts/setup-codex-profiles.sh --status`.

These shortcuts launch desktop profiles only. After private gateway setup,
terminal `codex` remains gateway-backed regardless of which desktop shortcut or
desktop mode is used. Profile setup now requires that validated gateway state in
subscription mode too, so terminal Codex never silently falls back to a direct
provider route.

### One-click profile and gateway setup

```bash
bash scripts/setup-private-ai-gateway.sh # required: terminal Codex uses the gateway
bash scripts/setup-codex-profiles.sh
# or double-click setup/Codex Profiles.command

# Optional narrower choices
bash scripts/setup-codex-profiles.sh --mode subscription
bash scripts/setup-codex-profiles.sh --mode gateway
bash scripts/setup-codex-profiles.sh --mode both
```

The gateway script asks for a vendor-neutral HTTPS endpoint, silently reads one
key, and fetches authenticated `/v1/models`. It automatically orders candidates
by protocol-relevant model names, then tries them until each API accepts one; it
does not leave the user at a Bash `#?` model-selection prompt. Before storing
active configuration, it prints each attempt and tests at most ten candidates per
API with a bounded timeout. It makes minimal successful requests against Anthropic Messages
(`/v1/messages`), OpenAI Chat Completions (`/v1/chat/completions`), and OpenAI
Responses (`/v1/responses`). Each surface can use a different advertised model.
Optional Fable/Opus Fast/Astra/Sol/Grok aliases are derived only when matching
catalog IDs exist; unavailable aliases are reported and skipped.
Transport, TLS, authentication, missing endpoint, quota, and invalid-response
failures are reported without printing the key or provider response body.

Only after these checks pass does it store the endpoint, key and generated client
state outside Git under protected user-local paths. Missing Claude Code, Codex,
or OpenCode binaries do not invalidate the gateway: the corresponding wrapper is
skipped with an installation reminder. Rerun gateway setup after installing that
client. Claude and OpenCode tracked modules are Stow-deployed automatically after
a conflict-free preview; existing conflicting files stop setup and are never
overwritten. Codex remains profile-aware and is migrated only by
`setup-codex-profiles.sh`. Both scripts print the exact files they create, link,
move, park, retain, or skip.

The profile script does not contact the gateway, ask for a key, or rotate one. It
only deploys the already-prepared gateway Codex configuration to the selected
home and installs the pinned profile tool plus Stow-managed launch commands. The same protected key can serve Claude Code,
Codex CLI and OpenCode without being copied into tracked configurations.

### Changing modes later

Rerun `setup-codex-profiles.sh` with the new mode. The script records the selected
mode locally and moves the inactive home under
`~/.local/state/dotfiles/codex-profiles/`; it does not merge subscription and
gateway state or delete the inactive home.

| Transition | Result |
| --- | --- |
| Subscription → gateway | Subscription home is parked; gateway becomes `~/.codex` |
| Gateway → subscription | Gateway home is parked; subscription returns to `~/.codex` |
| Subscription or gateway → both | Subscription uses `~/.codex`; gateway uses `~/.codex-aigateway` |
| Both → one mode | The inactive home is parked; only `~/.codex` remains active |

Thus `~/.codex-aigateway` exists as an active home only in `both` mode.

The endpoint can be any compatible gateway, including a self-hosted proxy or a
service such as Vercel AI Gateway. Compatibility depends on the models and APIs
that gateway advertises. OpenCode Zen itself remains an OpenCode provider/account;
use its OpenAI-compatible endpoint only when your account exposes one.

### Launch, status and rotation

```bash
cxs
cxg
bash scripts/setup-codex-profiles.sh --status
bash scripts/setup-private-ai-gateway.sh --status
herdr integration status

# Replace the one shared key and regenerate all gateway clients
bash scripts/setup-private-ai-gateway.sh --rotate-key
```

Runtime credentials, auth files, sessions, SQLite databases, logs, histories,
plugins and Electron data are never tracked or shared. Remove only the downloaded
`codex-profile` executable with `bash scripts/setup-codex-profiles.sh --uninstall`; revoke
the gateway key before intentionally deleting `~/.config/private-ai-gateway`.

## Files

| Repository file | Active path | Purpose |
| --- | --- | --- |
| `codex/.codex/config.toml` | `~/.codex/config.toml` | Current model, reasoning, desktop preferences, integrations, and permissions |
| `codex/.codex/keybindings.json` | `~/.codex/keybindings.json` | Current desktop keyboard preferences |
| `codex/.codex/hooks.json` | `~/.codex/hooks.json` | Lifecycle hook configuration |
| `codex/.codex/AGENTS.md` | `~/.codex/AGENTS.md` | Shared engineering standards and ten scoped stack guides |
| `codex/.codex/rules/dotfiles.rules` | `~/.codex/rules/dotfiles.rules` | Generated command policy |

The current settings were imported from this Mac, including `gpt-6-astra`,
`medium` default reasoning, desktop appearance settings, existing plugins and MCP runtimes.
The shared service tier is `default`; use Fast mode for individual tasks when needed.
The earlier migration had already removed two broken Caveman hook entries; the
current empty hook configuration is now versioned. No nonexistent hook scripts
are installed. New hooks still require Codex's native review/trust flow.

## Install the app

```bash
brew install stow python node
brew install --cask chatgpt
```

Use the ChatGPT desktop app installed through Homebrew. A separate Codex CLI
installation is not required. The helper locates the bundled runtime in
`/Applications/ChatGPT.app` or `~/Applications/ChatGPT.app` and requires Codex
0.153.1 or newer. Update the app with `brew upgrade --cask chatgpt`.

Check the bundled runtime with
`/Applications/ChatGPT.app/Contents/Resources/codex --version` before deploying.
The Homebrew release can lag this minimum: the September 7, 2026 CI run received
0.151.0-alpha.7.2. If the bundle is too old, wait for a compatible app update;
the migration helper refuses to modify files with an unsupported runtime.
CI uses a pinned 0.153.1 CLI only for sandbox verification and fixture versions
for migration tests, including rejection of older bundles. This does not change
the ChatGPT-only installation on user devices.

## Deploy

For a clean destination:

```bash
cd ~/.dotfiles
stow --no-folding --simulate --verbose codex
stow --no-folding codex
```

For an existing Codex configuration, use the backup helper first:

```bash
bash scripts/bootstrap-codex.sh plan
bash scripts/bootstrap-codex.sh apply
bash scripts/bootstrap-codex.sh check
```

The helper backs up conflicting configuration files outside Git, then invokes
GNU Stow. It does not merge settings or adopt runtime directories. Review any
existing settings you want to retain in the repository TOML before applying.
`plan` lists files needing links without printing values; `check` returns nonzero
if a managed file is no longer linked. It refuses unknown files in the module,
folded runtime directories, unexpected config symlinks, and detected literal
credential fields. Its isolated Python runtime uses `tomlkit==0.13.3` under
`~/.local/share/dotfiles/codex-runtime` (or `$XDG_DATA_HOME/dotfiles/codex-runtime`).

Avoid editing app settings during migration. Keep the dotfiles checkout at a
stable location because the links target it. Restart Codex to load instructions
and defaults; existing tasks can retain their permission overrides.

## Update and review

Commit deliberate preferences and reusable keybindings. App-version stamps,
trusted-service connection metadata, and newly discovered project paths are local
runtime changes, not automatically useful shared defaults. Stage individual TOML
hunks when these appear alongside preference edits; do not commit the whole file
without review. The existing snapshot still contains Mac-specific paths, so this
workflow does not make the entire TOML portable between different home directories.

Edit `codex/.codex/config.toml`, `keybindings.json`, or `hooks.json` directly.
Changes through a symlink-aware editor at `~/.codex/config.toml` reach the same
file in Git. Review GUI changes before committing: apps can add runtime paths,
project trust, or replace a symlink with a regular file when saving settings.
Run the link check after app updates. If the app replaces a link, reconcile the
new local file with the repository file before restowing; the backup helper
preserves that local file but does not automatically import its changes.

```bash
node scripts/validate-agent-policy.mjs
bash scripts/bootstrap-codex.sh check
git diff -- codex/
```

Normal preference edits do not require regeneration. For policy or engineering
standards, edit `agent-policy/catalog.json` or `agent-policy/instructions/`, then:

```bash
node scripts/apply-agent-policy.mjs --codex-only
node scripts/validate-agent-policy.mjs
```

The generator refreshes the marked permission block in the actual TOML and the
instruction/rule adapters. It preserves model, desktop, and integration settings
outside that block. `--codex-only` also refreshes Claude's shared instruction
adapters; use the command without that flag when changing policy for all clients.
If the app removes the marked block, validation stops instead of guessing where
to rewrite permissions. Restore the markers around the existing generated
`permissions.dotfiles` tables before regenerating.

## Keyboard shortcuts: defaults with voice and pet shortcuts

Codex inherits its current built-in shortcuts for ordinary app actions. There are
no overrides for new task, command menu, attention navigation, plan mode, review,
terminal or model picker. Removing those entries lets future app defaults apply.

The only active custom bindings in `codex/.codex/keybindings.json` are voice and the pet:

| Shortcut | Action | Scope |
| --- | --- | --- |
| Hyper+V | Toggle voice chat | Codex/ChatGPT app |
| Hyper+M | Start dictation | Codex/ChatGPT app |
| Hyper+B | Show/hide pet (buddy) | Global while Codex runs |
| Control+Shift+V | Default voice chat shortcut, retained | App |
| Control+Shift+D | Default dictation shortcut, retained | App |

Hyper means Control+Option+Command+Shift, supplied by held Caps Lock in the
**Hyperland** Karabiner profile. Focus Codex with Hyper+J for voice or dictation. V means voice; M means microphone; B means buddy. The pet hotkey toggles visibility through the native openAvatarOverlay command, replacing Option+Space because Codex allows only one global pet binding. This was verified from the installed desktop app’s bundled command handler on September 12, 2026. These three Hyper keys are reserved from global app launches,
Rectangle actions and Alfred workflows. Existing global dictation shortcuts remain
disabled; these bindings operate inside the app.

An override replaces a command's default list, so the two voice commands explicitly
include their native shortcuts. Other commands are omitted to inherit defaults;
`key: null` disables a shortcut and is not how defaults are restored.
Command IDs and override semantics were verified in the installed app's registry
on September 8, 2026. The default voice keys also match the
[official command reference](https://learn.chatgpt.com/docs/reference/commands).

Hyper+number routes to Control+Option+number for macOS desktops, preserving Codex's
native Control+1/2/3 view switches. Run `bash scripts/setup-hyper-macos.sh apply`
when deploying this change to another Mac and log out/back in to load the native
shortcut changes. Open Settings > Keyboard Shortcuts to inspect the app bindings;
voice availability depends on the current view. If an already-running app shows
old overrides, reopen it when convenient. No microphone session is started by setup.

## Other Macs and local state

This is a direct snapshot of the current Mac's configuration, including its
runtime paths and trusted project entries. Before stowing it on another Mac,
review home-directory paths, worktree paths, marketplace/MCP runtime paths, and
project trust entries. They are not automatically portable or silently rewritten.
The app may refresh its own runtime entries after installation; review the diff
before sharing those changes back to Git.

The configured parent roots are `$HOME/Documents/Codex`, `$HOME/Developer/GitHub`,
and `$HOME/Developer/Projects` (stored as absolute paths on this Mac). An isolated
Codex 0.153.1 test confirmed that trusting a parent alone does not enable a nested
Git repository's project config; an exact repository entry does. Existing child
entries are therefore retained to preserve working project trust. Parent entries
do not currently mean recursive trust.

Only the five base configuration files above and the two ISO profiles below belong to this module. Credentials,
login state, sessions, databases, histories, browser state, plugin downloads,
memories, and local `rules/default.rules` stay outside it. Never use `stow --adopt`
on the entire Codex home. Authentication happens separately on each Mac.
Automatic Claude import sync is disabled so it cannot overwrite the shared
instructions or recreate missing imported hooks.

## Skills

```bash
git clone https://github.com/rahulnakmol/skills.git ~/Developer/GitHub/skills
bash scripts/bootstrap-skills.sh --codex --dry-run
bash scripts/bootstrap-skills.sh --codex
```

`SKILLS_REPO` selects another checkout. This uses the upstream linker at
`~/.agents/skills` without installing other tools' adapters or third-party plugins.
The initial installation linked 59 skills and six doctrine groups from commit
`ac577ed84c09b142b9f3f06716139cc556bc410c`. Update that checkout explicitly and rerun
the linker; dotfiles does not vendor the skills. Optional upstream hooks remain
opt-in. Plugin binaries and account connections must be installed on each Mac.

## Claude parity map

| Claude baseline | Codex implementation | Status |
| --- | --- | --- |
| Architecture spine; ten stack/cloud guides | Shared generated content; all guides loaded with scope headings | Content parity; different loading mechanism |
| Secret Read/Edit denies | Named profile generated from all catalog paths | Verified for sandboxed local commands |
| Auto-mode environment and Git policy | Global instructions, workspace profile, explicit approval policy | Adapted; no equivalent to Claude's entire auto-mode classifier |
| Shell confirm/deny policy | Generated command-prefix rules plus global instructions | Rules govern escalation; not a universal command firewall |
| `feature-dev`, `superpowers` | First-party `sdlc`, `architect`, `tdd`, `deliver` skills | Workflow adaptation |
| `code-review`, `pr-review-toolkit`, `code-simplifier` | Codex review plus `safeguard`, `shakedown`, `refactor` skills | Workflow adaptation |
| `commit-commands` | Shared Git/PR guidance plus `deliver` | Workflow adaptation |
| `security-guidance`, `azure` | Shared security/Azure instructions and `responsible-ai-governance` | Guidance parity; provider connections remain local |
| `frontend-design` | Existing Product Design/Figma plugins; first-party branding skills | Integration-specific; reinstall through Codex |
| `skill-creator`, `plugin-dev`, `mcp-server-dev`, `agent-sdk-dev` | Codex system skills and existing OpenAI Developers/plugin tooling | Integration-specific |
| `claude-code-setup`, `claude-md-management` | Shared generation, installer, doctor, parity validator | Codex-specific implementation |
| `chrome-devtools-mcp` | Existing browser/computer-use integrations | Device-specific permissions and runtimes |
| `remember`, `ralph-loop` | Existing Codex memory/task capabilities and `grit` skill | Different semantics; no automatic history migration or loop hooks |
| `explanatory-output-style`, `learning-output-style`, `caveman` | Low verbosity preference; explicit task instructions | No exact plugin translation |
| Caveman lifecycle hooks | Remove only exact stale imported commands when their scripts are absent | Broken imports repaired; optional hook behavior not reproduced |
| Keybindings and statusline | Native Codex UI; context usage and Catppuccin code theme | UI adaptation; Claude keybindings/statusline script remain Claude-specific |

All 21 enabled Claude plugin IDs at implementation time are represented above.
Capabilities in different plugins are not asserted to be equivalent in every detail.

## Enforcement boundaries

The named `dotfiles` profile extends `:workspace`, permits ordinary command
network access, and adds catalog-based filesystem denies. Actual macOS tests
verify read/write denial for synthetic environment, key, and Terraform variable
files. `.env.example` is also denied by the broad `.env.*` rule, matching the
current Claude deny list; narrower exceptions are not claimed to work.

Command `.rules` govern escalation. Commands already allowed within the sandbox
may not escalate, so these rules are not a universal command firewall. Full
Access tasks, MCP, browser/computer use, cloud, and connectors have separate
controls. No complete equivalence to Claude's auto-mode classifier or global
network filtering is claimed. See the parity map for adaptations.

## Rollback

The migration helper prints an ID and saves only replaced non-secret files and
prior link targets under `~/.local/share/dotfiles/codex-backups/<id>/migration.json`
with private permissions. It does not back up the entire Codex home.

```bash
bash scripts/bootstrap-codex.sh rollback <migration-id>
```

Rollback restores previous files, modes, and links. It refuses to overwrite
files or source configs edited after migration. Skills and app installation are
separate and remain installed.

## Validation

```bash
export PATH="/Applications/ChatGPT.app/Contents/Resources:$PATH"
node scripts/validate-agent-policy.mjs
node --test scripts/test-codex-policy.mjs
python3 -m venv /tmp/codex-validation
/tmp/codex-validation/bin/python -m pip install -r scripts/codex-requirements.txt
/tmp/codex-validation/bin/python scripts/test-codex-config.py
/tmp/codex-validation/bin/python scripts/test-codex-sandbox.py
```

CI installs the ChatGPT app through Homebrew and uses a pinned CLI for the real
macOS sandbox test. Tests cover keybinding conflicts, real file links, direct edits reaching the repository,
rollback, idempotence, conflicts, config validation, policy preservation, and
sandbox behavior with synthetic fixtures. No model calls or credentials are
needed. Linux remains outside scope.

## References

- [Configuration](https://learn.chatgpt.com/docs/config-file/config-basic)
- [Instructions](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
- [Permissions](https://learn.chatgpt.com/docs/permissions)
- [Command rules](https://learn.chatgpt.com/docs/agent-configuration/rules)
- [Hooks](https://learn.chatgpt.com/docs/hooks)
- [Skills](https://learn.chatgpt.com/docs/build-skills)

## ISO output styles

Two optional CLI profiles carry the same instructions as Claude's output styles:

| Repository file | Active path | Purpose |
| --- | --- | --- |
| `codex/.codex/iso-24495.config.toml` | `~/.codex/iso-24495.config.toml` | Plain language |
| `codex/.codex/iso-2651x.config.toml` | `~/.codex/iso-2651x.config.toml` | Technical documentation, anchored on ISO/IEC/IEEE 26514:2022 |

Deploy with `stow --no-folding codex` (use the migration helper above for conflicts).
Select a style when starting the CLI:

```bash
codex --profile iso-24495
codex --profile iso-2651x
```

Each profile adds only `developer_instructions`. It inherits base settings and
preserves normal engineering behavior. Existing `developer_instructions`, if added
to the base config later, are replaced by the selected profile's value; merge any
required base text into both profiles then. No profile is enabled by default.
Profiles are a documented CLI feature; a desktop output-style picker is not assumed.
For a desktop task, ask Codex to read the chosen profile file and follow its writing
instructions for that task.

These styles are practical adaptations of public ISO summaries, not compliance
claims. The 2651x style does not claim to implement the entire standards family.
See [ISO 24495-1](https://www.iso.org/standard/78907.html),
[ISO/IEC/IEEE 26514](https://www.iso.org/standard/77451.html),
[Codex profiles](https://learn.chatgpt.com/docs/config-file/config-advanced#profiles),
and [developer instructions](https://learn.chatgpt.com/docs/config-file/config-reference).
