# opencode

OpenCode harness configuration. **Agents, workflows, and SDLC doctrine are installed from [rahulnakmol/skills](https://github.com/rahulnakmol/skills)**.

## Private AI gateway (CLI only)

Run `bash scripts/setup-codex-profiles.sh` once per macOS user. Gateway or both mode fetches the authenticated
`/v1/models` catalog, asks for a default, and writes an isolated configuration under
`~/.config/private-ai-gateway/opencode`. The provider contains every unique advertised model rather
than a hardcoded subset, and reads the same protected key used by Claude Code and Codex through
OpenCode's `{file:...}` substitution. The ordinary `opencode` command selects both that config file
and directory, so Herdr's generated plugin is loaded from the same isolated location.

Re-running setup refreshes the catalog. `--status` does not contact the gateway or print values;
`--rotate-key` updates the single shared key.

## Files (configs only)

| File | Target |
|------|--------|
| `.config/opencode/opencode.json` | `~/.config/opencode/opencode.json` |
| `.config/opencode/tui.json` | `~/.config/opencode/tui.json` |

Agents, commands, workflows, skills, and plugins install via `bootstrap-skills.sh` (not vendored in dotfiles).

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

This deploys SDLC agents, commands, workflows, and method docs to `~/.config/opencode/`.

## Workflow aliases

Shell aliases in the `zsh` module (`ocwf`, `ocwfl`, `ocwfv`) wrap the skills-installed workflow runner.

## Further reading

- [Skills bootstrap script](../../scripts/bootstrap-skills.sh)
- [rahulnakmol/skills wiki](https://github.com/rahulnakmol/skills/wiki)
