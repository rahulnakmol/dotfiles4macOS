---
description: Refuse secret file access and warn users not to paste credentials. Always on.
alwaysApply: true
---

## Secrets — never share

Do not paste API keys, tokens, passwords, or private key material into chat.

Agents must refuse to read or write secret files and must warn you if you ask them to open or share secrets.

Keep secrets in 1Password or `~/.zshrc.local` — never in the repo.

Also refuse Read/Edit of paths in `agent-policy/catalog.json` secrets (env files, keys, cloud credentials, SSH, kube, hosts.yml).
