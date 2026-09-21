# Herdr on macOS

Herdr provides persistent, agent-aware terminal workspaces with the same `C-a` prefix used by this
repository's tmux configuration. The tracked module contains reusable configuration only; runtime
state, pane history, conversations, generated integration files, and credentials stay on each Mac.

## Install and deploy

Herdr is installed and Stowed by both FDE and TF profiles. For a manual setup:

```bash
brew install herdr
stow herdr
herdr config check
```

The config uses `/bin/zsh` as a login shell so Apple Silicon Homebrew setup from `.zprofile` and
`~/.local/bin` from `.zshrc` are available in panes. It uses Catppuccin, disables persisted pane
screen history, resumes supported agent sessions after a Herdr restart, and stores worktrees under
`~/Developer/Worktrees`.

## Gateway-backed CLI integrations

Run gateway setup first when needed, then choose Codex profile mode. Gateway setup owns the key and
installs Claude Code and OpenCode integrations when those clients exist. Codex profile setup installs
Codex integration(s) only after it assigns the active home or homes:

```bash
bash scripts/setup-private-ai-gateway.sh         # gateway or both mode only
bash scripts/setup-codex-profiles.sh --mode both # or gateway / subscription
herdr integration status
```

Exact generated targets are `~/.config/private-ai-gateway/claude`,
`~/.config/private-ai-gateway/opencode`, and the selected Codex home. A single profile mode uses
`~/.codex`; only both mode adds `~/.codex-aigateway`. Claude and
Codex integrations provide native session identity/restore. OpenCode's integration also
provides lifecycle state. The integration files are generated locally and are intentionally not
committed. Herdr currently hardcodes its OpenCode install target, so setup safely stages that
integration in a temporary home and copies only the generated integration files into the isolated
gateway OpenCode directory; it does not modify ordinary `~/.config/opencode` state. Re-run gateway
setup after a Herdr upgrade to refresh release-matched integrations.

Both Codex integrations can coexist on disk because setup invokes Herdr with each `CODEX_HOME`.
Herdr may display both with the same `codex` label rather than a profile-qualified label; use the
explicit desktop launchers or terminal `codex` to choose the home. State is never collapsed.

Cursor Agent integration is not installed by the gateway setup. Cursor CLI remains authenticated to
the official Cursor account and must never receive the gateway key as `CURSOR_API_KEY`. If you use
Cursor Agent in Herdr, install its independent integration with `herdr integration install cursor`.

## Keybindings

| Key | Action |
| --- | --- |
| `C-a ?` | Show active keybindings |
| `C-a q` | Detach; panes keep running |
| `C-a c` | New tab |
| `C-a '` / `C-a \` | Split below / right |
| `M-arrows` | Move between panes |
| `M-H` / `M-L` | Previous / next tab |
| `C-a x` | Close pane |
| `C-a z` | Toggle pane zoom |
| `C-a [` | Copy mode |
| `C-a r` | Reload configuration |
| `C-a Shift-C` | Claude Code popup |
| `C-a Shift-O` | OpenCode popup |
| `C-a D` | Gateway Codex popup |

Popup commands resolve through `~/.local/bin`, including in a tmux/Herdr process started before the
wrappers were installed. This prevents an old server PATH or `~/.opencode/bin` from bypassing them.
The tracked Herdr commands name those wrapper paths directly.

Agent names use stable Catppuccin colors while state icons retain their urgency color. Pane history
is disabled because terminal output can contain secrets; detaching still preserves running panes and
the workspace layout.
