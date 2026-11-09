# Documentation

Follow the repository in this order:

1. Install the core dotfiles with [setup.md](setup.md).
2. Stop there, or add [Raycast script commands](modules/raycast.md).
3. Use the owning module page for each tool's setup, behavior and maintenance.

## Find what you need

| Goal | Documentation |
| --- | --- |
| Install Zsh, tmux, Herdr, Neovim, Git and the other core modules | [Set up the dotfiles](setup.md) |
| Use Raycast script commands for layouts, Dock presets and focus | [Raycast](modules/raycast.md) |
| Choose TF or FDE role apps | [Profile selection](setup-profiles.md) |
| Find Raycast, tmux and Herdr shortcuts | [Hotkeys](hotkeys.md) |
| Configure Codex CLI and two desktop profiles | [Codex](modules/codex.md) |
| Configure one tool | [Module documentation](modules/) |

Core setup is complete before adding Raycast. TF and FDE install role apps.
Automation is the Raycast Script Commands.

## Documentation ownership

| Location | Owns |
| --- | --- |
| [`setup.md`](setup.md) | Core prerequisites, clone, Stow and post-install journey |
| [`setup-profiles.md`](setup-profiles.md) | TF/FDE role-app selection |
| [`hotkeys.md`](hotkeys.md) | Raycast-first global map plus tmux and Herdr entry points |
| [`modules/`](modules/) | Complete setup, behavior and maintenance for each tool |
| [`guides/profiles/`](guides/profiles/) | Generated TF/FDE profile details and checklists |
| [`adr/`](adr/) | Architecture decisions and trade-offs |

Keep module-specific instructions in the owning module page. Do not create a
second guide for the same tool. Generated FDE/TF files must be changed through
`scripts/workstation-manual.mjs` and `scripts/render-workstation-docs.mjs`.

Run `node --test scripts/test-documentation.mjs` after moving or renaming docs.
