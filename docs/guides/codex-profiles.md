# Codex CLI and two ChatGPT desktop profiles

This setup uses the original signed `/Applications/ChatGPT.app` for two isolated desktop identities:

| Route | Command | Codex home | Electron data | Authentication |
| --- | --- | --- | --- | --- |
| Subscription desktop | `chatgpt-subscription` | `~/.codex` | stock ChatGPT data | normal ChatGPT subscription sign-in |
| Gateway desktop | `chatgpt-aigateway` | `~/.codex-aigateway` | `~/.codex-aigateway/electron-user-data` | shared file-backed gateway key |
| Gateway CLI | `codex` | `~/.codex-aigateway` | none | shared file-backed gateway key |

The two desktop processes can run concurrently because the named gateway profile has separate Codex
and Electron state. They still have the same signed bundle ID, name and icon after launch, so Dock,
app-switcher and bundle-ID automation cannot reliably focus a particular profile. Re-run the explicit
launcher command to focus or reuse that profile. The repository never copies or re-signs ChatGPT.app.

## Ownership matrix

| Owner | Paths | Contents |
| --- | --- | --- |
| Repository: subscription module | `codex/.codex/{config.toml,AGENTS.md,hooks.json,keybindings.json,rules/dotfiles.rules,*.config.toml}` | Existing subscription desktop preferences, reviewed policy and output styles |
| Repository: gateway module | `codex-aigateway/.codex-aigateway/{AGENTS.md,hooks.json,keybindings.json,rules/dotfiles.rules}` | Selective reusable policy only; gateway pet shortcut is disabled to avoid duplicate global registration |
| Repository: generator | `scripts/templates/codex-aigateway-config.toml` | Endpoint-neutral provider/policy template; placeholders are not usable credentials or endpoints |
| Machine-local shared gateway | `~/.config/private-ai-gateway/{endpoint,client.key,default-model,model-aliases.json}` | One endpoint, one mode-0600 key, selected default and catalog-derived aliases for Claude Code, Codex and OpenCode |
| Machine-local Codex gateway | `~/.codex-aigateway/config.toml` | Rendered Responses provider, model and file-backed reference to `client.key` |
| Machine-local Claude gateway | `~/.config/private-ai-gateway/claude/` and `~/.local/bin/claude` | Isolated Claude CLI state and wrapper |
| Machine-local OpenCode gateway | `~/.config/private-ai-gateway/opencode/` and `~/.local/bin/opencode` | Complete authenticated model catalog, config, state and wrapper |
| Machine-local launchers | `~/.local/bin/{claude,codex,opencode,gateway-model,chatgpt-subscription,chatgpt-aigateway,codex-profile}` | Gateway-only CLI routes, non-secret model resolver and explicit desktop routes |
| Runtime only | both homes' `auth.json`, sessions, history, SQLite, logs, Electron data, plugins, trust and marketplace state | Never tracked, copied, linked or shared |

`claude/` and `opencode/` retain only their ordinary reusable policy configuration. Gateway endpoint,
key and generated providers are never written into those tracked modules. Cursor remains official-
account-only and the setup never writes `CURSOR_API_KEY` or modifies Cursor state.

## Install or apply

Install ChatGPT and the CLI clients through the normal profile journey, then run the one-click entry
point. It defaults to both desktop profiles and configures all three gateway-backed CLI clients:

```bash
bash scripts/setup-codex-profiles.sh
# or double-click setup/Codex Profiles.command
```

Choose a narrower desktop journey when needed:

```bash
bash scripts/setup-codex-profiles.sh --mode subscription
bash scripts/setup-codex-profiles.sh --mode gateway
bash scripts/setup-codex-profiles.sh --mode both
```

Gateway or both mode prompts for a vendor-neutral HTTPS endpoint, silently reads one key, fetches
authenticated `/v1/models`, selects the default Codex/OpenCode model, and optionally maps the local
names `fable`, `astra`, `sol` and `grok` to IDs from that authenticated response. No tracked file
guesses those IDs. It installs immutable
`codex-profile` v1.2.0 from commit `d2260b800297a2b6441b3341c5c3ac48b67d59a1` only after checking
SHA-256 `8b32679d8be7d44eaf424c9f1fdf971817226c35b155c33c0082f98243825a2a`.

Subscription mode runs the backed-up selective `bootstrap-codex.sh` deployment. Gateway mode creates
the real `~/.codex-aigateway` directory with mode 0700, renders only `config.toml`, and links the four
reviewed gateway policy files individually. It never Stows, adopts, clones or shares a complete Codex
home. Existing conflicting gateway policy files stop setup rather than being overwritten.

## Shell and model conveniences

Both Bash and Zsh keep `~/.local/bin` ahead of Homebrew and `~/.opencode/bin`, so `claude`, `codex`
and `opencode` resolve to gateway wrappers. Existing commands such as `cc`, `ccs` and `cco` still
call `claude`. Additional functions resolve models from `model-aliases.json`:

| Command | Client | Machine-local alias |
| --- | --- | --- |
| `ccf` | Claude Code | `fable` |
| `cda` | Codex | `astra` |
| `cds` | Codex | `sol` |
| `cdg` | Codex | `grok` |

An unavailable alias fails without a guessed fallback. After a catalog change, rerun
`scripts/setup-private-ai-gateway.sh`; setup validates every saved mapping and stops if a mapped
model disappeared. Edit or remove only `~/.config/private-ai-gateway/model-aliases.json`, then rerun
to select replacements. Key rotation reuses this non-secret mapping rather than duplicating it.

## Launch and verify

Launch sequentially or concurrently:

```bash
chatgpt-subscription &
chatgpt-aigateway &
codex --version
```

Ordinary terminal `codex` always clears inherited profile/runtime variables and uses
`CODEX_HOME=~/.codex-aigateway`. The desktop launchers clear `CODEX_HOME`, `CODEX_ACCESS_TOKEN`,
`CODEX_SQLITE_HOME`, `CODEX_ELECTRON_USER_DATA_PATH` and `CODEX_PROFILE_NAME` before asking
`codex-profile` to launch `default` or `aigateway` with `open -n`.

Use `chatgpt-subscription` and `chatgpt-aigateway` for deterministic profile launch. Raycast alias
`cx`, Hyper+J, Finder/Open and Workmode target `com.openai.codex`; because both processes have that
same signed bundle ID, generic actions cannot select one profile or guarantee which window receives
focus. Workmode focus may also quit either instance when its mode excludes Codex.

Use value-free checks:

```bash
bash scripts/setup-codex-profiles.sh --status
bash scripts/setup-private-ai-gateway.sh --status
herdr integration status
```

Herdr integrations are generated under `~/.config/private-ai-gateway/claude`,
`~/.config/private-ai-gateway/opencode`, `~/.codex-aigateway`, and—when subscription or both mode is
selected—`~/.codex`. Herdr can install into both Codex homes, but its UI may label both simply as
Codex. The separate `CODEX_HOME` and launcher remain the reliable identity; setup never merges state.

On a target Mac, launch in both orders and verify separate histories, sessions, SQLite files and
window preferences without sending a paid prompt. The portable fake-app harness verifies the launch
arguments and state boundary; this Linux CI/orb cannot prove real signed-app concurrency.

## Update, rotate and rollback

Pull dotfiles updates, rerun the installer, then run status. The pinned `codex-profile` binary is
replaced only after checksum verification. To update the pin, review a new immutable upstream release,
commit its exact commit and checksum together, and rerun tests.

Rotate the single key in place and regenerate every gateway client:

```bash
bash scripts/setup-private-ai-gateway.sh --rotate-key
```

Rollback subscription links with the migration ID printed by apply:

```bash
bash scripts/bootstrap-codex.sh rollback <migration-id>
```

Remove only the explicit desktop launchers while preserving profiles and data:

```bash
bash scripts/setup-codex-profiles.sh --uninstall
```

Delete `~/.codex-aigateway` only after closing the gateway desktop and intentionally retiring its
history, sessions and Electron state. Revoke the gateway key before deleting
`~/.config/private-ai-gateway`. Uninstalling `codex-profile` is separate:
`rm -f ~/.local/bin/codex-profile ~/.local/bin/codex-profiles`.
