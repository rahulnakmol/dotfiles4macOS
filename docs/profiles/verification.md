# FDE / TF verification record

September 9, 2026. Branch: openai/fde-tf-workstation-profiles.

## Verified automatically

- Existing keyboard, mouse, menu, layout, Stow and focus-session regressions pass.
- TF generates only Work and Code + Amp focus sessions; Work includes Claude
  Desktop. FDE retains all five existing sessions. Shared launch keys stay stable.
- Native Swift focus tests exercise TF as well as FDE with substituted desktop
  operations. Missing named DockFlow presets fail before any app quits.
- Profile installation, repeated apply, TF → FDE → TF, rollback, private Alfred
  file preservation, unmanaged file conflicts and redirected paths are tested in
  temporary homes. Tests never quit the user's apps or request real timers.
- Karabiner and the unrelated Homebrew Session messenger are excluded from
  package installation. Installed app identity is checked, including CleanShot
  Setapp. No personal signing/SSH/account configuration is deployed.
- Both preset packs match the native export structure and contain only reviewed
  application metadata, names and spacers. No folders or custom actions.
- Read-only TF setup on the source Mac reports no configuration conflicts or
  missing GUI/guided apps. No profile switch was applied to this running Mac.

## Native DockFlow check

The source Mac's seven presets were exported successfully through DockFlow's
Backup & Restore UI, with Include folders disabled. The FDE pack is sanitized
from that export; TF is constructed in the same schema with its approved app sets.

Import preview could not be completed through the current computer-use
connection: the native file chooser kept Open disabled for both tf.json and the
untouched vendor export. The chooser was cancelled. No duplicate presets were
imported and the live library was not modified. This does not establish that the
pack is rejected by DockFlow; it leaves native import/round-trip validation pending.

## Per-Mac acceptance still required

Install/activate licenses and permissions, connect the selected Alfred bundle,
import Rectangle and DockFlow, verify native desktop assignments, test physical
Hyper/Meh keys, and test real focus quits/timer startup with work saved. Log out
and back in; repeat on the second Mac and external display. Native app imports,
permission state and Session Pro capability are not proven by unit tests.
