# opencode

OpenCode harness configuration. **Agents, workflows, and SDLC doctrine are installed from [rahulnakmol/skills](https://github.com/rahulnakmol/skills)** — see [`docs/skills.md`](../skills.md).

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

- [Skills bootstrap](../skills.md)
- [rahulnakmol/skills wiki](https://github.com/rahulnakmol/skills/wiki)
