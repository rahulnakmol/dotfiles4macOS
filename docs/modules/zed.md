# zed

Zed editor configuration with Catppuccin theme and AI integration (macOS-specific).

## Files

| File | Target |
|------|--------|
| `.config/zed/settings.json` | `~/.config/zed/settings.json` |
| `.config/zed/keymap.json` | `~/.config/zed/keymap.json` |

## Configuration

- **Theme**: Catppuccin Latte (light) / Catppuccin Macchiato (dark)
- **Vim mode**: Enabled
- **Font**: FantasqueSansM Nerd Font (UI), ZedMono Nerd Font (editor)
- **Tab bar**: Hidden
- **Scrollbar**: Hidden
- **Relative line numbers**: Enabled
- **Format on save**: Enabled

## MCP Servers

- Azure Context Server
- GitHub MCP Server
- Context7 MCP Server

## Security

API keys are referenced as environment variables (`${GITHUB_PAT}`, `${CONTEXT7_API_KEY}`). Set these in `~/.zshrc.local`.

## Deploy

```bash
stow zed
```
