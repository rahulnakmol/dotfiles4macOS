# Documentation

Follow the repository in this order:

1. Install the core dotfiles with [setup.md](setup.md).
2. Stop there, or choose one productivity path:
   - [Raycast Focus & Layouts](modules/raycast.md): one shared configuration.
   - [Alfred + Karabiner + Rectangle Pro](modules/alfred.md): choose TF or FDE.
3. Use the owning module page for each tool's setup, behavior and maintenance.

## Find what you need

| Goal | Documentation |
| --- | --- |
| Install Zsh, tmux, Herdr, Neovim, Git and the other core modules | [Set up the dotfiles](setup.md) |
| Use Raycast for one shared productivity configuration | [Raycast Focus & Layouts](modules/raycast.md) |
| Use Alfred, Karabiner and Rectangle Pro | [Alfred stack](modules/alfred.md) |
| Choose TF or FDE for the Alfred stack | [Profile selection](setup-profiles.md) |
| Find Raycast, tmux and Herdr shortcuts | [Hotkeys](hotkeys.md) |
| Configure Codex CLI and two desktop profiles | [Codex](modules/codex.md) |
| Configure one tool | [Module documentation](modules/) |

Core setup is complete before choosing productivity automation. Raycast uses one
shared configuration. TF and FDE apply only to the Alfred/Karabiner/Rectangle Pro
path.

## Documentation ownership

| Location | Owns |
| --- | --- |
| [`setup.md`](setup.md) | Core prerequisites, clone, Stow and post-install journey |
| [`setup-profiles.md`](setup-profiles.md) | TF/FDE selection for the Alfred productivity path |
| [`hotkeys.md`](hotkeys.md) | Raycast-first global map plus tmux and Herdr entry points |
| [`modules/`](modules/) | Complete setup, behavior and maintenance for each tool |
| [`guides/profiles/`](guides/profiles/) | Generated TF/FDE profile details and checklists |
| [`adr/`](adr/) | Architecture decisions and trade-offs |

Keep module-specific instructions in the owning module page. Do not create a
second guide for the same tool. Generated FDE/TF files must be changed through
`scripts/workstation-manual.mjs` and `scripts/render-workstation-docs.mjs`.

Run `node --test scripts/test-documentation.mjs` after moving or renaming docs.
