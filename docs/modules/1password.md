# 1password

1Password SSH agent configuration.

## Files

| File | Target |
|------|--------|
| `.config/1Password/ssh/agent.toml` | `~/.config/1Password/ssh/agent.toml` |

## Configuration

SSH keys are sourced from the "Developer" vault in 1Password.

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
