# Shell Aliases Reference

Complete reference for all 120+ shell aliases. See `zsh/.zshrc.d/README.md` for the canonical reference with tables.

## Naming Convention

All aliases follow a consistent prefix pattern for discoverability:

| Prefix | Tool | Example |
|--------|------|---------|
| `az` | Azure CLI | `azl`, `azs`, `azvml` |
| `azd` | Azure Dev CLI | `azdu`, `azdd`, `azdp` |
| `b` | Homebrew | `bi`, `bup`, `buu` |
| `cc` | Claude Code | `ccc`, `cco`, `cc!` |
| `d` | Docker | `dps`, `dex`, `drun` |
| `dc` | Docker Compose | `dcu`, `dcd`, `dcl` |
| `g` | Git | `gs`, `ga`, `gp` |
| `gh` | GitHub CLI | `ghl`, `gpc`, `gprs` |
| `m` | Mac App Store | `mi`, `ml`, `mug` |
| `n` | npm | `ni`, `nr`, `nb` |
| `oc` | OpenCode | `occ`, `ocr`, `ocpr` |
| `s` | SSH | `sa`, `sc`, `sh` |
| `t` | Tmux | `ta`, `tn`, `tks` |

## Quick Reference

### Most Used

```bash
# Git workflow
gs          # git status
ga .        # git add all
gc "msg"    # git commit -m "msg"
gp          # git push
gpl         # git pull
glog        # visual git log

# AI coding
cc          # claude code session
cco         # claude opus mode
oc          # opencode TUI
ocr "task"  # opencode headless run

# Navigation
prj         # cd ~/Developer/Projects
dotfiles    # cd ~/.dotfiles
..          # cd ..

# Package management
bi foo      # brew install foo
buu         # full brew maintenance
```
