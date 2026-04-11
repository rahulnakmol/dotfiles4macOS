# starship

Cross-shell prompt with Catppuccin Macchiato palette.

## Files

| File | Target |
|------|--------|
| `.config/starship.toml` | `~/.config/starship.toml` |

## Configuration

- **Palette**: Catppuccin Macchiato (all 4 flavors defined)
- **Character**: Green checkmark (success), red X (error), peach arrow
- **Git branch**: Bold mauve
- **Directory**: Bold lavender, truncation at 4 levels
- **Vim mode**: Subtext1 indicator

## Deploy

```bash
brew install starship
stow starship
```

Starship is initialized automatically in `.zshrc`.
