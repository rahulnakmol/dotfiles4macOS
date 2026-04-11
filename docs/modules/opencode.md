# opencode

OpenCode configuration with Zen provider and agent profiles.

## Files

| File | Target |
|------|--------|
| `.config/opencode/opencode.json` | `~/.config/opencode/opencode.json` |
| `.config/opencode/tui.json` | `~/.config/opencode/tui.json` |
| `.config/opencode/update-models.sh` | `~/.config/opencode/update-models.sh` |

## Configuration

- **Provider**: OpenCode (Zen)
- **Default model**: `opencode/claude-sonnet-4-6`
- **Small model**: `opencode/gpt-5-nano`
- **TUI theme**: Catppuccin with scroll acceleration

## Agent Profiles

| Agent | Model | Use Case |
|-------|-------|----------|
| `quick` | MiniMax M2.5 | Fast queries, cheap/free |
| `pro` | Claude Opus 4.6 | Architecture, debugging, deep analysis |
| `ui` | Gemini 3.1 Pro | Frontend, design systems, multimodal |

## Model Updater

```bash
~/.config/opencode/update-models.sh           # Update to latest Zen models
~/.config/opencode/update-models.sh --dry-run  # Preview changes
```

Requires `curl` and `jq`.

## Install

```bash
brew install opencode
stow opencode
```

## Shell Aliases

See `oc*` aliases in `zsh/.zshrc.d/aliases.zsh` and tmux `C-a o` key table.
