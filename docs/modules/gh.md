# gh

GitHub CLI configuration with 25+ workflow aliases.

## Files

| File | Target |
|------|--------|
| `.config/gh/config.yml` | `~/.config/gh/config.yml` |

## Key Aliases

| Alias | Command | Description |
|-------|---------|-------------|
| `co` | `pr checkout` | Checkout a PR locally |
| `prc` | `pr create --fill` | Create PR with auto-filled body |
| `prm` | `pr merge --squash --delete-branch` | Squash merge and clean up |
| `done` | `pr merge --squash --delete-branch --auto` | Auto-merge when checks pass |
| `dash` | `pr status && issue list --assignee @me` | Personal dashboard |
| `review-me` | `search prs --review-requested=@me` | PRs awaiting my review |

## Deploy

```bash
brew install gh
stow gh
gh auth login
```

Note: `hosts.yml` is gitignored (contains auth tokens). Run `gh auth login` after stowing.
