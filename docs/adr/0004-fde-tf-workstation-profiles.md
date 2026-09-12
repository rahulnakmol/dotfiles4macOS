# 0004 — FDE and TF workstation profiles

Status: approved for implementation by the user; FDE and TF names confirmed.

## Context

The full personal setup is useful for FDE work. Tech Founders need the same
general CLI and productivity foundation with Claude Desktop, Cursor and Codex as
agentic apps. Preset IDs and personal configuration must not follow a colleague
to a new Mac. Existing users have private Alfred workflows and histories.

## Decision

Compose FDE and TF from one shared catalog and generator. Keep Hyperland and
shared key positions identical. Generate owned workflow files, layouts and
guides per profile. Store generated Stow packages and profile-local Alfred
preferences under the user's local share directory. Switch only known owned
links; keep each profile's preferences intact. Source modules and exports stay
in Git; local profile selection and rollback journals do not.

Productivity is an explicit `--productivity` option on every plan/apply/check.
Default profiles install role apps and CLI tools and Stow core settings only.
Alfred, Karabiner, Rectangle Pro, DockFlow, CleanShot and Session orchestration
are excluded from default installs, generation, preference changes and checks.
An omitted flag leaves previously configured productivity settings untouched;
it is not an uninstall or deactivation request. Journals record the scope for
rollback, and retained productivity files keep their ownership hashes.

TF Work adds Claude Desktop to Edge/Teams (30 minutes); Code uses Cursor and Innovate uses Codex (45 minutes each). Both
maximize Zen Browser on Desktop 1, maximize the agent on Desktop 2 and split
Ghostty two-thirds / Slack one-third on Desktop 3. Desktop 4 stays available. Zen provides Claude/Obsidian as a non-quitting
layout. FDE retains its existing five focus sessions. Native app desktop
assignments and Rectangle imports remain explicit per-Mac steps.

DockFlow packs use its native exported array schema, with an allowlist removing
folders and custom actions. TF has five presets; FDE preserves seven exported
presets. The installed CLI selects by unique name, validated before focus quits.
Imports are guided because this CLI offers list/apply/get-apps, not import/export.

Use the vendor's DMG/PKG installer for Karabiner and guide services/driver
permissions. Use Homebrew for supported packages, detect existing Setapp apps,
and guide native Amp (FDE only) and Session focus-timer installation. Homebrew's session
cask is a different product. Do not migrate personal signing/auth/agent-trust
settings as part of workstation deployment.

## Alternatives

Two repositories would duplicate maintenance. Rewriting tracked generated files
for the selected profile would create cross-device drift. Copying whole Alfred
preferences bundles would copy private variables and history. Independent
profile-local preferences retain data at the cost of first-use Gallery setup.

## Consequences

FDE and TF can be tested in temporary homes without changing a running desktop.
Activation is repeatable and journaled; later edits block overwrite/rollback.
Packages and native app imports are outside file rollback. On profile changes,
users reconnect Alfred and import Rectangle/DockFlow settings deliberately.
Switching to TF does not uninstall apps or delete FDE's saved DockFlow presets.

References: [Karabiner installation](https://karabiner-elements.pqrs.org/docs/getting-started/installation/),
[DockFlow exports and CLI](https://github.com/AppitStudio/dock-flow-updates/blob/main/release-notes.html),
[Session URL automation](https://www.stayinsession.com/learn/session-url-scheme).
