# ssh

SSH configuration with 1Password agent integration for macOS.

## Files

| File | Target |
|------|--------|
| `.ssh/config` | `~/.ssh/config` |
| `.ssh/allowed_signers` | `~/.ssh/allowed_signers` |

## Configuration

- **Identity agent**: 1Password socket at `~/Library/Group Containers/2BUA8C4S2C.com.1password/t/agent.sock` (macOS-specific path)
- **Allowed signers**: Ed25519 public keys for commit verification — one per signing
  identity, so a machine that signs with its own on-disk key is verifiable here too

## authorized_keys is deliberately NOT tracked

`**/.ssh/authorized_keys` is gitignored. It is per-machine *access policy*, not a
portable dotfile: stowing it onto another machine would silently grant those keys
inbound SSH there too, and a key added on one host would then grant access to every
host that pulls this repo. Public keys are not secrets, so this is about
propagation rather than disclosure.

Private keys are excluded separately by `**/.ssh/id_*`, which covers both halves of
a keypair.

## Deploy

```bash
stow ssh
```

## macOS Notes

The 1Password agent socket path is macOS-specific. On Linux it would be `~/.1password/agent.sock`.
