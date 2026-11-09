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
- **Commit signing**: Enabled, with the staged diff included when an editor opens
- **Tag signing**: Enabled
- **Editor**: Neovim
- **History**: `pull` rebases, `fetch` prunes, and the first `push` sets the upstream
- **Conflicts**: `zdiff3` markers, rerere, and autostash so a dirty tree can rebase
- **Status and diff**: filesystem monitor, untracked cache, rename detection, and `less -FRX` so a short command does not sit in a pager
- **Aliases**: `st`, `sw`, `br`, `ci`, `amend`, `fixup`, `unstage`, `last`, `lg`, `ds`, `incoming`, `outgoing`, `pushf`, `root`
- **Per-machine overrides**: `~/.config/git/config.local`, then `~/.config/git-private/config.local`. The second file is outside the Stow tree and holds this laptop's GitHub account split. Neither file is committed. Login files only replace name, email, and signing key. Both logins inherit the settings above.

## Per-machine overrides

The shared config ends with:

```gitconfig
[include]
    path = ~/.config/git/config.local
[include]
    path = ~/.config/git-private/config.local
```

Git treats a missing include as a no-op, so machines without either file are
unaffected, and last-wins means `git-private` overrides `config.local`.
`~/.config/git` is a folded Stow symlink on this laptop, so files created
there land in the public worktree. Account files go in `~/.config/git-private/`
instead, which is not part of the repo. `config.local` remains the headless
override and is gitignored via `**/git/*.local` if it is ever copied into the tree.

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

## Two GitHub accounts

This laptop keeps one private gitconfig per GitHub login in `~/.config/git-private/`. Each file holds that login's name, email, and signing key. `config.local` includes the personal login, then an `includeIf` for the work checkout. Do not create `~/.gitconfig`; it replaces this Stow-managed file.

| Checkout | Account | Signing key |
|---|---|---|
| `~/Developer/rahulnakmol/` and everywhere except the work checkout | `rahulnakmol` | Developer vault, item "Git Signing" |
| work checkout | `rahulakmol_gofynd` | GoFynd vault, item "Git Signing" |

Both still sign through `op-ssh-sign`. The work gitconfig also rewrites `git@github.com:` and `https://github.com/` to the `github.com-gofynd` SSH host. Push authentication is a separate 1Password item: Developer vault "Git Authentication" for the personal host, and the GoFynd signing item for `github.com-gofynd` because that vault has no second key.

The work email stays in that private gitconfig. This repo does not record it. GitHub has to list that same address as verified on `rahulakmol_gofynd`, or the organization can reject the push.

## Dependencies

- 1Password with SSH agent enabled
- `stow 1password` and `stow ssh` for agent socket config

## Deploy

```bash
stow git
```
