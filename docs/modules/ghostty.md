# ghostty

GPU-accelerated terminal emulator with Catppuccin Macchiato theme.

## Files

| File | Target |
|------|--------|
| `.config/ghostty/config` | `~/.config/ghostty/config` |

## Configuration

| Setting | Value |
|---------|-------|
| Theme | Catppuccin Macchiato |
| Font | Mononoki Nerd Font, size 16 |
| Window | 200x50 characters |
| Padding | 20px |
| Opacity | 95% with blur |
| Shell integration | zsh with ssh-terminfo |

## Install

```bash
brew install --cask ghostty
stow ghostty
```

## Dependencies

- Mononoki Nerd Font: `brew install --cask font-mononoki-nerd-font`
