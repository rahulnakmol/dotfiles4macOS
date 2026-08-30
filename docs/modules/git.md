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
- **Per-machine overrides**: `~/.config/git/config.local`, included last so it wins

## Per-machine overrides

The shared config ends with:

```gitconfig
[include]
    path = ~/.config/git/config.local
```

Git treats a missing include as a no-op, so machines without the file are
unaffected, and last-wins means anything set there overrides the values above.
Gitignored via `**/git/*.local`, matching the `**/zsh/*.local` convention.

This exists because not every machine can sign through 1Password. A headless box
that auto-restarts after a power cut has no GUI session, so `op-ssh-sign` cannot
run and every commit fails. Such a machine overrides two keys:

```gitconfig
[user]
    signingkey = ~/.ssh/id_signing_macstudio.pub
[gpg "ssh"]
    program = /usr/bin/ssh-keygen
```

Its public key goes in `allowed_signers` (tracked, so the laptops can verify)
and is registered with GitHub as a **signing** key, never an authentication key.

Note `git config --global --get` reads only the global file and does **not**
follow includes — use `git config --get`, or `--list --show-origin` to see which
file wins.

## Dependencies

- 1Password with SSH agent enabled
- `stow 1password` and `stow ssh` for agent socket config

## Deploy

```bash
stow git
```
