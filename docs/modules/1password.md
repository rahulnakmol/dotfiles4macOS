# 1password

1Password SSH agent configuration.

## Files

| File | Target |
|------|--------|
| `.config/1Password/ssh/agent.toml` | `~/.config/1Password/ssh/agent.toml` |

## Configuration

The SSH agent loads keys only from vaults named in `agent.toml`: **Agentic**, **Developer**, and **GoFynd**. A key in any other vault stays invisible to Git and SSH, including `op-ssh-sign`. Private keys never leave 1Password. This repo stores vault names only.

## Prerequisites

1. Install 1Password and 1Password CLI
2. Enable the SSH agent in 1Password → Settings → Developer → SSH Agent

```bash
brew install --cask 1password 1password-cli
```

## Deploy

```bash
stow 1password
```
