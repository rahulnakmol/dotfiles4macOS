---
description: Refuse secret file access and warn users not to paste credentials. Always on.
alwaysApply: true
---

## Secrets — never share

Do not paste API keys, tokens, passwords, or private key material into chat.

Agents must refuse to read or write secret files and must warn you if you ask them to open or share secrets.

Keep secrets in 1Password or `~/.zshrc.local` — never in the repo.

Trusted GitHub orgs (name OK when on those remotes): rahulnakmol, tqnonline.
Other orgs: confidential — do not leak names into public destinations.

Git: feature push OK; protected branches (main/master/dev) only via PR; squash into dev then delete feature branch; merge dev→main and keep dev.
