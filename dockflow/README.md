# DockFlow portable presets

Import `presets/fde.json` or `presets/tf.json` with DockFlow Settings → Backup &
Restore → Import Backup. These are native DockFlow exports, not Stow modules.

FDE preserves the seven presets exported from the source Mac on September 9,
2026. Missing apps and sparse media presets reflect that export; the media apps
are not installed automatically. TF provides Default, Work, Code and Zen with
minimal approved app lists. Finder is supplied by the Dock itself.

Imports add presets. Export your existing setup privately first, and rename
same-named presets before importing. The new workflows require exactly one match
per name and never rely on a different Mac's IDs. Keep DockFlow app quit/launch
actions disabled: `fs` owns closing apps, `wl` must not close apps, and Rectangle
owns geometry. Confirm these behavior settings on each installation.

To refresh a pack, export selected presets with Include folders unchecked, then:

```sh
node scripts/sanitize-dockflow.mjs /private/tmp/DockPresets.json dockflow/presets/fde.json
node --test scripts/test-workstation.mjs
```

Review the resulting names and app list before committing. The sanitizer copies
only top-level application URLs, spacers, app identity metadata and preset names;
it discards folder stacks, other paths and custom actions. Preset names/app labels
also require human review. Do not commit the raw private export or live database.
The documented native schema is confirmed by the installed app's export; native
import and second-Mac resolution must also be checked when the app version changes.
