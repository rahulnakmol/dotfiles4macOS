# iTerm2

macOS-only terminal emulator kept as a failsafe alongside Ghostty.

## Files

| File | Target |
|------|--------|
| `.config/iTerm2/com.googlecode.iterm2.plist` | iTerm2 preferences |
| `.config/iTerm2/iTerm2.conf.itermexport` | Exported configuration |

## Configuration

- **Theme**: Catppuccin Frappe color preset
- **Font**: Configured via preferences plist

## Notes

- This is a macOS-specific module with no Linux equivalent
- Ghostty is the primary terminal; iTerm2 is kept as a fallback
- For Meta key support in tmux, set "Left Option key" to "Esc+" in Profiles → Keys

## Deploy

```bash
stow iTerm2
```
