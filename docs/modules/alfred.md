# Alfred

Alfred runs the optional FDE and TF workflows. Karabiner supplies Hyper and Meh;
Rectangle Pro arranges windows. DockFlow and Session handle the Dock and timers.
Core profile installation does not enable this setup.

| I want to… | Open |
| --- | --- |
| Set up a Mac | [Alfred + Karabiner + Rectangle Pro guide](../guides/alfred.md) |
| Find TF commands and hotkeys | [TF reference](alfred-tf-hotkeys.md) |
| Find FDE commands and hotkeys | [FDE reference](alfred-fde-hotkeys.md) |
| Use the original direct-Stow configuration | [Shared hotkeys](alfred-hotkeys.md) · [Bootstrap reference](hyper-bootstrap.md) |
| Compare with Raycast | [Choose a setup](../setup-profiles.md#optional-next-steps) |

## Configuration and data

| Item | Location or action |
| --- | --- |
| Active Alfred preferences | `~/.config/alfred`; select it in Alfred's Advanced preferences. |
| Generated profile files | `~/.local/share/dotfiles/workstations/fde` or `tf`. |
| Source profiles | [workstation-profiles.mjs](../../scripts/workstation-profiles.mjs) |
| Utility workflow catalog | [alfred-workflows.json](../../scripts/catalogs/alfred-workflows.json) |
| Earlier Raycast extension inventory | [raycast-extensions.json](../../scripts/catalogs/raycast-extensions.json); a recorded snapshot, not a live audit. |

Run `plan`, `apply` and `check` with `--profile tf --productivity` or
`--profile fde --productivity` through `scripts/setup-workstation.sh`.
The [setup guide](../guides/alfred.md#install) has the complete commands.

Profile changes require selecting the active Alfred preferences, restarting
Alfred and reimporting native Rectangle and DockFlow settings. Stow alone does
not apply those app imports. Private workflow settings, histories and licenses
stay on the Mac.

The profile hotkey references are generated from the same source as the
workflows. Update the source and run `node scripts/render-workstation-docs.mjs`
to regenerate them.
