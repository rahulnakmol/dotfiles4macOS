# Skills

Agent behavior (SDLC fleet, impact pipeline, specialists) lives in **[rahulnakmol/skills](https://github.com/rahulnakmol/skills)** — not in this dotfiles repo.

## Bootstrap

```bash
git clone https://github.com/rahulnakmol/skills.git ~/Developer/GitHub/skills
./scripts/bootstrap-skills.sh
```

This installs:

- Universal skills via `npx skills add rahulnakmol/skills` → `.agents/skills/` and `.claude/skills/`
- OpenCode agents, commands, workflows, and SDLC method docs via `install-adapters.sh`
- Optional third-party skills from `skills.manifest.yaml`

## What stays in dotfiles

- Shell, editor, git/gh, and harness **configs** only
- `opencode.json` default model slots and MCP wiring
- Cavecrew/caveman third-party shims (until fully manifest-driven)

## Documentation

- Skills repo wiki: https://github.com/rahulnakmol/skills/wiki
- Legacy operator guide (being superseded): [`docs/guides/opencode-sdlc.md`](guides/opencode-sdlc.md)
