# Set up the dotfiles on macOS

Start with the core dotfiles. They provide an opinionated but reusable baseline
for Zsh, Bash, Git, GitHub CLI, tmux, Herdr, Neovim, Ghostty, Starship and Bat.
The core does not require a launcher, keyboard remapper or window manager.

After core setup, either stop or choose one productivity path:

| Path | Profiles | Documentation |
| --- | --- | --- |
| Raycast Focus & Layouts | One shared configuration | [Raycast module](modules/raycast.md) |
| Alfred + Karabiner + Rectangle Pro | TF or FDE | [Alfred stack](modules/alfred.md) and [profile selection](setup-profiles.md) |

## 1. Install prerequisites and default apps

Install Apple Command Line Tools with xcode-select --install and Homebrew from https://brew.sh first.

```sh
# Core tools
brew install git node stow zsh tmux herdr neovim eza bat fd ripgrep fzf zoxide starship curl jq gh podman claude opencode zsh-autosuggestions zsh-syntax-highlighting zsh-autocomplete

# Terminal and configured font
brew install --cask ghostty font-jetbrains-mono-nerd-font

# Default desktop apps and everyday browser
brew install --cask zen claude cursor chatgpt

# Optional end-to-end testing browser
# brew install --cask google-chrome@canary
```

Open Zen once and choose Zen under Default web browser in macOS System Settings. Complete your own app sign-ins directly. Chrome Canary is for end-to-end testing, and Amp is optional from https://ampcode.com/app (its native app requires macOS 26+). Neither is a prerequisite for this baseline. Existing Chrome and Amp installations are left intact.

## 2. Set zsh as default shell

```bash
chsh -s $(which zsh)
```

Log out and back in for the change to take effect.

## 3. Clone the repo

```bash
git clone https://github.com/rahulnakmol/dotfiles4macOS.git ~/.dotfiles
cd ~/.dotfiles
```

## 4. Deploy modules with stow

Stow creates symlinks from each module directory into your home folder. Preview the explicit core list, resolve any conflicts by backing up and comparing existing files, then apply:

```sh
stow -n zsh bash bat starship tmux herdr ghostty nvim
stow zsh bash bat starship tmux herdr ghostty nvim
```

These are the same core modules used by the FDE/TF installer. Stow does not install apps. App installation above is independent of stowing Claude/Cursor/Codex settings.

Git and GitHub CLI are intentionally reviewed separately because the tracked Git
module contains a user identity and 1Password signing assumptions:

```bash
# Review docs/modules/git.md and git/.config/git/config first
stow -n git gh
stow git gh
gh auth login
```

## 5. Configure the private AI gateway and Codex desktop profiles

Gateway authentication and Codex profile selection are separate. After installing
the desired CLI tools and Herdr, run gateway setup first. It previews and deploys
the reviewed Claude and OpenCode Stow modules when they are not already linked,
then prepares the gateway. Codex Stow migration remains owned by the profile
installer so home transitions cannot race a separate `stow codex` command:

```bash
bash scripts/setup-private-ai-gateway.sh        # required: terminal CLIs use the gateway
bash scripts/setup-codex-profiles.sh --mode both # or subscription / gateway
bash scripts/setup-codex-profiles.sh --status
herdr integration status
```

The gateway script prompts for an HTTPS endpoint and one hidden shared key. It
fetches authenticated `/v1/models`, classifies models into protocol-appropriate
families, and automatically tries those candidates until it finds separate models
that work for Anthropic Messages, OpenAI Chat Completions, and OpenAI Responses.
It does not reuse Claude for Chat Completions or let legacy generic GPT entries
hide a later Codex/Responses candidate. It writes no active credential until all
three checks pass. There is no numbered model prompt; setup prints each classified
model attempt so a slow or
incompatible endpoint does not look frozen. Failures identify connectivity, TLS, authentication,
missing endpoint, quota, or invalid response shape without printing the key or
provider response body. Missing client binaries are skipped with an installation
reminder; rerun gateway setup after installing them. At completion it prints the
generated credential, model, client-home, wrapper, and follow-up paths without
printing their values.

The profile script never collects or rotates the key. Subscription-only and
gateway-only modes each expose one `~/.codex` home. Both mode uses subscription
at `~/.codex` and gateway at `~/.codex-aigateway`. Rerunning with another mode
parks the inactive home under local state instead of merging or deleting it.
Every mode requires the validated gateway first because terminal `codex` is
always gateway-backed. A per-user lock prevents simultaneous profile transitions;
subscription/both waits for the Codex Stow migration to finish before creating
desktop launchers. The final summary lists active, parked, and generated paths.
Claude Desktop is unchanged. Cursor CLI remains on the official Cursor account;
never set the gateway key as `CURSOR_API_KEY`. Follow the [Codex module](modules/codex.md)
for ownership, launch shortcuts, transitions, rotation, rollback, and uninstall.

Do not run stow */. Choose extra modules individually after reviewing them for your machine; Git/SSH/signing, credential and agent trust configuration are personal setup decisions. The baseline does not copy those settings or enable productivity automation. Existing personal users can consult the individual module guides for additional configuration.

## 6. Post-install steps

### Tmux plugins

TPM (Tmux Plugin Manager) bootstraps automatically on first tmux launch. If plugins are missing:

1. Start tmux: `tmux`
2. Press `C-a I` (capital I) to install plugins
3. Press `C-a r` to reload config

### Neovim plugins

LazyVim will auto-install plugins on first launch:

```bash
nvim
```

Wait for Lazy to finish, then quit and reopen. Run `:checkhealth` to verify everything is working.

### Bat themes

After stowing bat, build the theme cache:

```bash
bat cache --build
```

### 1Password SSH agent

If using 1Password for SSH keys and commit signing:

1. Install 1Password and the 1Password CLI
2. Enable the SSH agent in 1Password settings
3. Deploy the module: `stow 1password`
4. The SSH config and git config reference the 1Password agent socket automatically

### GitHub CLI

```bash
gh auth login
```

### Starship prompt

Starship initializes automatically from `.zshrc`. No extra setup needed after `stow starship`.

## 7. Local overrides

For machine-specific config that should not be committed:

- **Shell**: create `~/.zshrc.local` (sourced at the end of `.zshrc`)
- **Git**: use `~/.gitconfig.local` with `includeIf` directives
- **Secrets**: set `GITHUB_PAT`, `CONTEXT7_API_KEY`, etc. in `~/.zshrc.local`

## 8. Keeping things updated

After pulling changes from the repo:

```bash
cd ~/.dotfiles
git pull
stow zsh bash bat starship tmux herdr ghostty nvim   # re-stow selected core modules
```

Stow is idempotent — re-running it on an already-deployed module is safe.
