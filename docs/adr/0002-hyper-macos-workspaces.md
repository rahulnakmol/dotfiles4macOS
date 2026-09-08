# 0002 — Hyper navigation with native macOS desktops

Status: accepted for implementation by the user's setup request, September 8, 2026.

## Context

Work, Code and Zen use overlapping sets of apps on MacBook Air and Pro. The user
wants an Omarchy-inspired keyboard-first experience using existing Alfred,
Karabiner, Rectangle Pro and DockFlow licenses/configuration. The existing DockFlow numbers must remain easy to use while Hyper numbers
become direct desktop navigation; Codex has app-specific Hyper shortcuts.

## Decision

Use one **Hyperland** Karabiner profile with stable app identities and exactly
one direct shortcut per app. The approved tactile map puts Amp/Slack/Chrome/Finder
on A/S/D/F and Ghostty/Codex/Cursor/Claude on H/J/K/L. Word/Edge use W/E;
Teams/Excel/PowerPoint use I/O/P; Safari uses R and Obsidian uses N.
Media uses Z/X/C for Final Cut Pro/Motion/Compressor (edit/animate/export).
These are reserved launch bindings where installed; setup does not install them.
Hyper+Return maximizes. Hyper+left bracket/right bracket/backslash tiles
left/centre/right thirds in physical key order. Native Control+Left/Right switches
adjacent desktops, freeing Hyper brackets for window geometry. Right Option
provides Meh (Control+Option+Shift) for DockFlow numbers. Caps Lock provides Hyper;
Hyper+1…9/0 selects existing desktops through native Control+Option+number shortcuts.
Control+Option keeps Codex’s native Control+1/2/3 available. Codex uses defaults
except Hyper+V for voice chat and Hyper+M for dictation.
Hyper+; and quote tile two-thirds; Hyper+Left/Right move between displays. Karabiner
handles the modifier, native app focus/launch and key remapping. Alfred provides
the **Hyper** command menu and fixed action dispatch. DockFlow changes the Dock;
Rectangle Pro controls proportional window geometry. Use generic layout names.

Generate native adapters from `scripts/hyper-config.json`. Store the owned workflow,
guide and config snapshots in Stow modules, excluding runtime data and credentials.
Preserve unrelated shortcuts and check collisions across their owners.

## Alternatives

An initials-first map is easier to name but gives home-row keys to less-used media
apps. The chosen map prioritizes reach and stable groups at the cost of relearning
nine app keys and three thirds keys.

Independent shortcuts in every app are less discoverable and harder to keep
consistent. Introducing a separate tiling manager would change the workspace
model and is a larger migration than the existing-stack request.

## Consequences

The same keys and fractions work across screen sizes without copying machine IDs
or window titles. A searchable menu and guide reduce the memorization burden.
App minimum widths can prevent thirds; balanced halves and maximize are included.

Native desktop placement remains a deliberate per-Mac step. Rectangle does not
provide reliable exact numbered-Space restoration, so the workflow visits and
arranges each desktop. Shared apps remain unassigned for the general layouts; the later
[focus-session decision](0003-focus-sessions.md) assigns its specific apps to two desktops. Licenses,
permissions, desktop creation and physical/fresh-login checks stay device-local.

Evidence: [Rectangle layouts](https://rectangleapp.com/pro/docs/layouts/),
[maintainer's Spaces limitation](https://github.com/rxhanson/RectanglePro-Community/discussions/689),
[Karabiner native app API](https://karabiner-elements.pqrs.org/docs/json/complex-modifications-manipulator-definition/to/software_function/open_application/),
[Omarchy hotkeys](https://learn.omacom.io/2/the-omarchy-manual/53/hotkeys).
