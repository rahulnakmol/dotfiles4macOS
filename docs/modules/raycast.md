# Raycast Workmode on macOS

Workmode is the optional shared productivity setup for FDE and TF. It composes
Raycast, DockFlow and Session; it does not require Alfred, Karabiner or Rectangle.

```sh
# From the dotfiles checkout, after installing the documented prerequisites:
bash scripts/setup-raycast-workstation.sh install
```

Or double-click `setup/Raycast.command`. After “Importing Workmode”, wait for **ready**, then **Control+C**;
the extension remains installed in Raycast. Repeat after pulling updates.
Use `build` for build-only validation, `check` for source/link checks, and
`rollback` to unlink configuration. To disable it, remove Workmode in Raycast
Settings too: without a Stow link it still has bundled defaults.

- [Install and per-Mac manual checklist](../raycast-workstation.md#install)
- [Command aliases and shortcuts](../raycast-aliases.md)
- [Extension source and build guide](../../extensions/raycast-workstation/README.md)
- [Scope: native tools first, no speculative features](../adr/0005-workmode-local-install.md)

## What is saved

The `raycast` Stow module contains only reviewed Workmode configuration under
`~/.config/raycast-workstation`. It is not part of default core Stow. The extension
source stays in `extensions/raycast-workstation`; the Swift helper is compiled
locally for each Mac and is not committed.

Raycast's native settings, aliases and hotkeys are separate. Configure them in
Raycast or use its supported private sync/export flow. Do not Stow Raycast's live
databases or commit exports, credentials, clipboard history or chats. Keep
private `.rayconfig` backups outside Git; enter any passphrase directly in Raycast.
See [Raycast import/export](https://manual.raycast.com/import-export).

## Keyboard ownership

Raycast uses **Option+Space**; Spotlight keeps **Command+Space**. Raycast owns
Caps Lock Hyper, with Include Shift and tap Escape. Meh is the physical
Control+Option+Shift chord. Use native Applications entries for app hotkeys and
native Window Management for individual window actions. Avoid overlapping
Karabiner, Alfred or Rectangle shortcuts if migrating an existing Mac.

The [extension inventory](../raycast-extensions.json) is a historical snapshot,
not an instruction to install every Store extension. Install only what you use
and authenticate directly in each app. Live verification limits are recorded in
the setup guide; importing source alone does not validate every mode.
