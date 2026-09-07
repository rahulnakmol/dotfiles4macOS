# claude

Claude Code configuration — settings, keybindings, and custom statusline.

## Files

| File | Target | Purpose |
|------|--------|---------|
| `.claude/settings.json` | `~/.claude/settings.json` | Permissions, hooks, plugins, model defaults |
| `.claude/keybindings.json` | `~/.claude/keybindings.json` | 19 context-specific key binding groups |
| `.claude/statusline.sh` | `~/.claude/statusline.sh` | Catppuccin-themed statusline (model, git, context) |
| `.claude/CLAUDE.md` | `~/.claude/CLAUDE.md` | Global spine: always-loaded enterprise architecture rules |
| `.claude/rules/*.md` | `~/.claude/rules/*.md` | Path-scoped stack/cloud rules |
| `.claude/skills/responsible-ai-governance/` | `~/.claude/skills/responsible-ai-governance/` | On-demand governance skill |

## Settings

- **Statusline**: Custom Catppuccin-themed bash script showing model, git branch, vim mode, and context window usage
- **Plugins**: 31 official plugins enabled (LSPs, code review, security, data, etc.)

## Keybindings

19 context-specific binding groups covering Chat, Autocomplete, Settings, Scroll, Vim-style navigation, and more. Highlights:

| Key | Context | Action |
|-----|---------|--------|
| `meta+p` | Chat | Model picker |
| `meta+o` | Chat | Toggle fast mode |
| `meta+t` | Chat | Toggle thinking |
| `cmd+c` | Scroll | Copy selection (macOS) |
| `j`/`k` | Settings/Select | Vim-style navigation |

## Install

```bash
brew install claude
stow claude
```

## Shell Aliases

See `cc*` aliases in `zsh/.zshrc.d/aliases.zsh` and tmux `C-a c` key table.

## macOS Notes

- `cmd+c` for copy is included alongside `ctrl+shift+c` (Linux)
- `meta+` bindings use the Option (⌥) key on macOS

## Global Rules & Skills

The architecture spine and stack guides now share their source with Codex in
`agent-policy/instructions/`. Edit those sources and run
`node scripts/apply-agent-policy.mjs --codex-only`; the generated Claude files
retain their native path-scoped loading. See [Codex parity](codex.md).

Modular AI coding rules for a multi-cloud enterprise architecture practice. One file, one concern. They compose: a session pulls in the spine plus only the slices that match the files in play.

### Rule map

| File | Scope | Loads when |
|------|-------|------------|
| `CLAUDE.md` | Always | Every session |
| `rules/python.md` | `**/*.py` | Python files touched |
| `rules/go.md` | `**/*.go` | Go files touched |
| `rules/dotnet.md` | `**/*.cs` | C# files touched |
| `rules/typescript.md` | `**/*.ts` | TypeScript files touched |
| `rules/terraform.md` | `**/*.tf` | Terraform files touched |
| `rules/docker.md` | `**/Dockerfile` | Dockerfiles touched |
| `rules/cloud-gcp.md` | `**/gcp/**` | GCP infra files touched |
| `rules/cloud-azure.md` | `**/azure/**` | Azure infra files touched |
| `rules/agentic-ai.md` | `**/agents/**` | Agent code touched |
| `rules/power-platform-dynamics.md` | `**/*.sppkg` | Power Platform files touched |
| `skills/responsible-ai-governance/` | On-demand | Regulated industry context |

### Cursor-to-Claude mode mapping

| Cursor mode | Claude Code equivalent |
|---|---|
| Always (`alwaysApply: true`) | `CLAUDE.md` or rule without `paths:` |
| Auto-attach (`globs:`) | Rule with `paths:` frontmatter (CSV format) |
| Agent-requested | Skill with `description` (invoked on demand) |
| Manual (`@rule`) | Skill invoked via `/responsible-ai-governance` |

### Cloud-scoping caveat

Cloud rules are scoped by directory convention (`infra/gcp/**` → GCP, `infra/azure/**` → Azure). If your repo does not separate infra by cloud, remove the `paths:` from both cloud rule files so they load every session.

### CSV `paths:` format

User-level rules in `~/.claude/rules/` use CSV-string `paths:` instead of YAML arrays due to a Claude Code parser bug at user level (issues #21858, #19377). Example:

```yaml
paths: "**/*.py,**/requirements*.txt,**/pyproject.toml"
```
