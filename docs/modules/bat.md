# bat

Syntax-highlighted `cat` replacement with Catppuccin themes.

## Files

| File | Target |
|------|--------|
| `.config/bat/themes/Catppuccin Latte.tmTheme` | `~/.config/bat/themes/` |
| `.config/bat/themes/Catppuccin Frappe.tmTheme` | `~/.config/bat/themes/` |
| `.config/bat/themes/Catppuccin Macchiato.tmTheme` | `~/.config/bat/themes/` |
| `.config/bat/themes/Catppuccin Mocha.tmTheme` | `~/.config/bat/themes/` |

## Deploy

```bash
brew install bat
stow bat
bat cache --build    # Register themes
```

The active theme is set via `BAT_THEME="Catppuccin Macchiato"` in `.zprofile`.

## Aliases

| Alias | Command |
|-------|---------|
| `cat` | `bat` |
| `catt` | `bat --theme="Catppuccin Macchiato" --style="header,grid,numbers"` |
