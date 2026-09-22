# opencode

OpenCode harness configuration. **Agents, workflows, and SDLC doctrine are installed from [rahulnakmol/skills](https://github.com/rahulnakmol/skills)**.

## Private AI gateway (CLI only)

Run `bash scripts/setup-private-ai-gateway.sh` once per macOS user when gateway access is wanted.
The script previews and Stow-deploys this tracked `opencode` module automatically when needed;
conflicting existing files stop setup rather than being adopted or overwritten.
It fetches the authenticated `/v1/models` catalog, excludes Claude-family IDs from automatic
Chat Completions selection, validates a recognized chat-family model against
`/v1/chat/completions`, and writes an isolated configuration under
`~/.config/private-ai-gateway/opencode`. The provider contains every unique advertised model rather
than a hardcoded subset, and reads the same protected key used by Claude Code and Codex through
OpenCode's `{file:...}` substitution. The ordinary `opencode` command selects both that config file
and directory, so Herdr's generated plugin is loaded from the same isolated location.

All catalog models remain available for explicit selection in OpenCode. The family restriction
applies only to choosing and proving the safe default; setup does not assume that an Anthropic
model works through an OpenAI Chat Completions compatibility endpoint merely because both appear
in `/v1/models`.

Re-running gateway setup refreshes the catalog. `--status` does not contact the gateway or print values;
`--rotate-key` updates the single shared key.

During interactive setup, map **Opus Fast** to the newest accelerated Opus model actually advertised
by your gateway. tmux `C-a O`, then `p`, resolves that local mapping and opens OpenCode through the
private gateway. It deliberately does not hardcode OpenCode Zen's hosted-provider model ID. OpenCode's
interactive CLI has no `--variant fast` flag; current accelerated Claude serving modes are exposed as
separate catalog models, so the authenticated model selection is the durable source of truth.

## Files (configs only)

| File | Target |
|------|--------|
| `.config/opencode/opencode.json` | `~/.config/opencode/opencode.json` |
| `.config/opencode/tui.json` | `~/.config/opencode/tui.json` |

Agents, commands, workflows, skills, and plugins install via `bootstrap-skills.sh` (not vendored in dotfiles).
Clone the external `rahulnakmol/skills` repository at `~/Developer/GitHub/skills` or set
`SKILLS_REPO`. Bootstrap maps its supported `OPENCODE_CONFIG` target to
`~/.config/private-ai-gateway/opencode`; it does not run adapters against ordinary
`~/.config/opencode` or install a global gateway secret.

## Configuration

- **Providers**: GitHub Copilot and OpenCode Go (authenticated)
- **Default agent**: `sdlc` (installed by skills bootstrap)
- **Instructions**: `SDLC_METHOD.md`, `SDLC_LOOP.md` (installed by `install-adapters.sh`)
- **TUI theme**: Catppuccin

## Bootstrap

After `stow opencode`:

```bash
./scripts/bootstrap-skills.sh
```

With the private gateway configured, this deploys supported agents, commands,
workflows and method docs into the isolated
`~/.config/private-ai-gateway/opencode` location selected by the wrapper. It does
not copy the gateway key into the tracked `opencode` module.

## Workflow aliases

Shell aliases in the `zsh` module (`ocwf`, `ocwfl`, `ocwfv`) wrap the skills-installed workflow runner.

## Further reading

- [Skills bootstrap script](../../scripts/bootstrap-skills.sh)
- [rahulnakmol/skills wiki](https://github.com/rahulnakmol/skills/wiki)
