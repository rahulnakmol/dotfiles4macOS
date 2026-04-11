# git

Git configuration with SSH commit and tag signing via 1Password.

## Files

| File | Target |
|------|--------|
| `.config/git/config` | `~/.config/git/config` |

## Configuration

- **User**: Rahul N Akmol
- **Signing**: SSH (ed25519) via 1Password
- **Signing program**: `/Applications/1Password.app/Contents/MacOS/op-ssh-sign` (macOS path)
- **Commit signing**: Enabled
- **Tag signing**: Enabled

## Dependencies

- 1Password with SSH agent enabled
- `stow 1password` and `stow ssh` for agent socket config

## Deploy

```bash
stow git
```
