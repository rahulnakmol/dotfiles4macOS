# ssh

SSH configuration with 1Password agent integration for macOS.

## Files

| File | Target |
|------|--------|
| `.ssh/config` | `~/.ssh/config` |
| `.ssh/allowed_signers` | `~/.ssh/allowed_signers` |

## Configuration

- **Identity agent**: 1Password socket at `~/Library/Group Containers/2BUA8C4S2C.com.1password/t/agent.sock` (macOS-specific path)
- **Allowed signers**: Ed25519 public key for commit verification

## Deploy

```bash
stow ssh
```

## macOS Notes

The 1Password agent socket path is macOS-specific. On Linux it would be `~/.1password/agent.sock`.
