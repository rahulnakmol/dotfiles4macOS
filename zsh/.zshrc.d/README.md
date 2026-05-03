# ZSH Aliases Reference

Modular config files auto-loaded via `~/.zshrc` in sort order. All aliases follow a consistent naming convention: **prefix derived from the tool name** (e.g., `g` for git, `d` for docker, `cc` for claude code).

## File Structure

| File | Purpose | Loaded |
|------|---------|--------|
| `00-platform.zsh` | Detect platform, export `$DOTFILES_PLATFORM` and `$DOTFILES_BREW_PREFIX` | Always (first) |
| `aliases.zsh` | Universal aliases (git, tmux, docker, npm, ssh, editors, AI tools) | Always |
| `catppuccin-fzf-macchiato.sh` | FZF Catppuccin theme colors | Always |

## Navigation & File Listing

| Alias | Command | Description |
|-------|---------|-------------|
| `..` | `cd ..` | Go up one directory |
| `...` | `cd ../..` | Go up two directories |
| `prj` | `cd ~/Developer/Projects` | Jump to projects |
| `ghr` | `cd ~/Developer/Github` | Jump to GitHub repos |
| `dotfiles` | `cd ~/.dotfiles` | Jump to dotfiles |
| `zl` | `zoxide query \| fzf` | Fuzzy pick from zoxide history |

| Alias | Command | Description |
|-------|---------|-------------|
| `ls` | `eza -l` | Long listing (replaces ls) |
| `l` | `eza -F` | Compact listing with indicators |
| `ll` | `ls -alF` | All files, long format |
| `la` | `ls -A` | All except `.` and `..` |
| `lar` | `ls -laRt changed` | Recursive, sorted by change time |

## Homebrew (`b` prefix)

| Alias | Command | Description |
|-------|---------|-------------|
| `bi` | `brew install` | Install package |
| `bu` | `brew uninstall` | Uninstall package |
| `bl` | `brew list` | List installed |
| `bs` | `brew search` | Search packages |
| `binf` | `brew info` | Package info |
| `bup` | `brew update` | Update formula index |
| `bug` | `brew upgrade` | Upgrade packages |
| `buu` | `brew update && upgrade && cleanup` | Full maintenance |
| `bc` | `brew cleanup` | Remove old versions |

## Mac App Store (`m` prefix)

| Alias | Command | Description |
|-------|---------|-------------|
| `mi`  | `mas install` | Install app by ID |
| `mu`  | `mas uninstall` | Uninstall app |
| `ml`  | `mas list` | List installed App Store apps |
| `ms`  | `mas search` | Search App Store |
| `minf`| `mas info` | App info/lookup |
| `mo`  | `mas outdated` | List pending updates |
| `mug` | `mas upgrade` | Upgrade all outdated apps |
| `muu` | `mas outdated; mas upgrade` | Show pending, then upgrade all |

## Git (`g` prefix)

| Alias | Command | Description |
|-------|---------|-------------|
| `gs` | `git status` | Working tree status |
| `ga` | `git add` | Stage files |
| `gc` | `git commit -m` | Commit with message |
| `gp` | `git push` | Push to remote |
| `gpl` | `git pull` | Pull from remote |
| `gco` | `git checkout` | Switch branch/restore |
| `gb` | `git branch -a` | List all branches |
| `gf` | `git fetch` | Fetch remote changes |
| `gcl` | `gh repo clone` | Clone via GitHub CLI |
| `gb!` | `git blame` | Line-by-line blame |
| `glog` | `git log --oneline --graph` | Visual log |
| `gdiff` | `git diff` | Unstaged changes |
| `gdiffs` | `git diff --staged` | Staged changes |

## GitHub CLI (`gh` prefix)

| Alias | Command | Description |
|-------|---------|-------------|
| `ghl` | `gh auth login` | Login to GitHub |
| `ghs` | `gh auth status` | Auth status |
| `gsync` | `gh repo sync` | Sync fork |
| `gpc` | `gh pr create --fill --web` | Create PR |
| `gpv` | `gh pr view --web` | View PR in browser |
| `gprs` | `gh pr list` | List PRs |
| `gpx` | `gh pr checkout` | Checkout PR branch |
| `gic` | `gh issue create --web` | Create issue |
| `gil` | `gh issue list` | List issues |
| `grls` | `gh release list` | List releases |

## Tmux (`t` prefix)

| Alias | Command | Description |
|-------|---------|-------------|
| `t` | `tmux` | Start tmux |
| `ta` | `tmux attach -t` | Attach to session |
| `tl` | `tmux ls` | List sessions |
| `tk` | `tmux kill-session -t` | Kill session |
| `tn` | `tmux new -s` | New named session |
| `ts` | `tmux switch -t` | Switch session |
| `tks` | `tmux kill-session -a` | Kill all other sessions |

## Node.js / npm (`n` prefix)

| Alias | Command | Description |
|-------|---------|-------------|
| `ni` | `npm install` | Install deps |
| `nis` | `npm install --save` | Install as dependency |
| `nid` | `npm install --save-dev` | Install as dev dep |
| `nig` | `npm install -g` | Install globally |
| `nu` | `npm uninstall` | Uninstall |
| `nug` | `npm uninstall -g` | Uninstall globally |
| `nr` | `npm run` | Run script |
| `ns` | `npm start` | Start |
| `nt` | `npm test` | Test |
| `nb` | `npm run build` | Build |
| `nd` | `npm run dev` | Dev server |
| `nl` | `npm list --depth=0` | List local deps |
| `nlg` | `npm list -g --depth=0` | List global deps |
| `nup` | `npm update` | Update deps |
| `no` | `npm outdated` | Check outdated |
| `nci` | `npm ci` | Clean install |
| `na` | `npm audit` | Security audit |
| `naf` | `npm audit fix` | Fix audit issues |
| `np` | `npm publish` | Publish package |
| `ninit` | `npm init -y` | Init project |
| `nx` | `npx` | Execute package |
| `nv` | `node --version` | Node version |
| `npmv` | `npm --version` | npm version |

## Docker (`d` prefix)

| Alias | Command | Description |
|-------|---------|-------------|
| `d` | `docker` | Docker shorthand |
| `dps` | `docker ps` | Running containers |
| `dpsa` | `docker ps -a` | All containers |
| `di` | `docker images` | List images |
| `drun` | `docker run` | Run container |
| `dex` | `docker exec -it` | Exec into container |
| `dlogs` | `docker logs` | Container logs |
| `dlogsf` | `docker logs -f` | Follow logs |
| `dstop` | `docker stop` | Stop container |
| `dstart` | `docker start` | Start container |
| `drestart` | `docker restart` | Restart container |
| `dpull` | `docker pull` | Pull image |
| `dbuild` | `docker build` | Build image |
| `drm` | `docker rm` | Remove container |
| `drmi` | `docker rmi` | Remove image |
| `dcp` | `docker cp` | Copy files |
| `dinsp` | `docker inspect` | Inspect object |
| `dvol` | `docker volume ls` | List volumes |
| `dnet` | `docker network ls` | List networks |
| `dprune` | `docker system prune -af` | Remove all unused data |

### Compose (`dc` prefix)

| Alias | Command | Description |
|-------|---------|-------------|
| `dc` | `docker compose` | Compose shorthand |
| `dcu` | `docker compose up -d` | Start services (detached) |
| `dcd` | `docker compose down` | Stop and remove services |
| `dcl` | `docker compose logs -f` | Follow service logs |
| `dcps` | `docker compose ps` | List compose services |

## SSH (`s` prefix)

| Alias | Command | Description |
|-------|---------|-------------|
| `s` | `ssh` | SSH shorthand |
| `sa` | `ssh -A` | SSH with agent forwarding |
| `sc` | `nvim ~/.ssh/config` | Edit SSH config |
| `sk` | `ls ~/.ssh` | List SSH keys |
| `sr` | `ssh-add -D && ssh-add` | Reset and reload keys |
| `sh` | `ssh_host` | Fuzzy pick host from config |
| `sp` | `spub` | Print public key |

### Functions

| Function | Description |
|----------|-------------|
| `ssh_host` | Parses `~/.ssh/config` hosts, presents via fzf, connects to selection |
| `spub [keyfile]` | Prints public key from private key (default: `id_ed25519`) |
| `snew [comment] [file]` | Generates new ed25519 key |

## Claude Code (`cc` prefix)

| Alias | Command | Description |
|-------|---------|-------------|
| `cc` | `claude` | Launch interactive session |
| `ccc` | `claude -c` | Continue last conversation |
| `ccp` | `claude -p` | Non-interactive print mode |
| `ccr` | `claude --resume` | Resume specific session |
| `ccs` | `claude --model sonnet --permission-mode auto` | Sonnet — daily coding |
| `cco` | `claude --model opus --permission-mode auto` | Opus — complex tasks |
| `cch` | `claude --model haiku` | Haiku — quick answers |
| `ccpl` | `claude --model opus --permission-mode plan` | Opus plan — read-only |
| `cc!` | `claude --dangerously-skip-permissions` | Sonnet autopilot |
| `cco!` | `claude --model opus --dangerously-skip-permissions` | Opus autopilot |

## OpenCode (`oc` prefix)

| Alias | Command | Description |
|-------|---------|-------------|
| `oc` | `opencode` | Launch TUI |
| `occ` | `opencode -c` | Continue last session |
| `ocr` | `opencode run` | Headless run |
| `ocrc` | `opencode run -c` | Continue session headless |
| `ocm` | `opencode -m` | Use specific model |
| `ocw` | `opencode web` | Open web interface |
| `ocpr` | `opencode pr` | Review GitHub PR |
| `ocsl` | `opencode session list` | List sessions |
| `ocse` | `opencode export` | Export session JSON |
| `ocsi` | `opencode import` | Import session |
| `ocml` | `opencode models` | List models |
| `ocli` | `opencode providers login` | Login to provider |
| `ocst` | `opencode stats` | Usage statistics |
| `ocp` | `opencode --pure` | Launch without plugins |

## Azure CLI (`az` prefix)

| Alias | Command | Description |
|-------|---------|-------------|
| `azl` | `az login` | Login |
| `azld` | `az login --use-device-code` | Login via device code |
| `azlo` | `az logout` | Logout |
| `azs` | `az account show` | Current subscription |
| `azal` | `az account list -o table` | List subscriptions |
| `azas` | `az account set -s` | Switch subscription |
| `azwho` | `az ad signed-in-user show` | Current user |
| `azv` | `az version` | CLI version |
| `azup` | `az upgrade` | Upgrade CLI |

## Azure Developer CLI (`azd` prefix)

| Alias | Command | Description |
|-------|---------|-------------|
| `azdl` | `azd auth login` | Login |
| `azdlo` | `azd auth logout` | Logout |
| `azdi` | `azd init` | Initialize project |
| `azdu` | `azd up` | Provision + deploy |
| `azdd` | `azd down` | Tear down resources |
| `azdp` | `azd provision` | Provision only |
| `azddp` | `azd deploy` | Deploy only |
| `azdm` | `azd monitor` | Open monitoring |

## Editor & Utilities

| Alias | Command | Description |
|-------|---------|-------------|
| `v` / `vi` / `vim` | `nvim` | Neovim |
| `cat` | `bat` | Syntax-highlighted cat |
| `catt` | `bat` with Catppuccin | Fancy cat with headers and line numbers |
| `src` | `source ~/.zshrc` | Reload shell config |
| `cls` | `clear` | Clear terminal |
| `fzp` | `fzf --preview 'bat ...'` | Fuzzy find with bat preview |

## Naming Convention

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
