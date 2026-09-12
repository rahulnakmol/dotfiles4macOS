# Workmode keyboard audit

Audit date: 12 September 2026. This separates the saved target map from verified
live settings. Stowing `hotkeys.json` does not program Raycast's native hotkeys.

## Live findings

- Raycast opens with Option+Space and starts at login. Spotlight's Command+Space
  setting is enabled. Alfred is quit and its login startup is off.
- Raycast's native Caps Lock Hyper is active; Include Shift is on; tap sends Escape.
- Native window settings retain Rectangle-style Control+Option shortcuts. Previous/
  next display uses Control+Option+Command+Left/Right, without Shift.
- A trial of Hyper+Left, then Meh+Left, through computer control recorded only
  modifiers, without the arrow. Backspace/Delete also failed to clear the recorder.
  **Move to Previous Space is disabled** so the incomplete shortcut cannot run.
  Its remaining incomplete Control+Option assignment must be replaced before re-enabling it.
- No successful live Space-movement or resize acceptance test has been completed.
  Rectangle Pro was still running during the audit; its final retirement is pending.

## Target window map

**Control+Option owns window actions; Hyper owns applications.** Use the native
Rectangle-style preset for fractions, without introducing a remapper or extension
for individual window actions. The fractions below were observed in live settings.
The new comma/period Space bindings still require physical recording.

| Control+Option + | Native Raycast command |
|---|---|
| Left / Right | Left Half / Right Half |
| Up / Down | Top Half / Bottom Half |
| Return | Maximize |
| Forward Delete | Restore |
| D / F / G | First Third / Center Third / Last Third |
| E / T | First Two Thirds / Last Two Thirds |
| comma / period | Move to Previous Space / Move to Next Space — pending |
| minus / equals | Make Smaller / Make Larger |

Two useful arrangements: **E then G** places two apps left ⅔ + right ⅓;
**D then T** places them left ⅓ + right ⅔. Focus the intended app before each key.
On keyboards without Forward Delete, use Fn+Backspace for Restore.

Hold Caps Lock for Hyper. Meh remains physical Control+Option+Shift; Right Option
and Right Command retain normal modifier behavior. Codex owns Hyper+B/V/M for
pet/voice/dictation. Native Command+Tab, Command+backtick, Command+C/V/X, Command+W/Q
and Control+Left/Right remain available.

## Double-tap exploration — recommendations, not installed

| Gesture | Suggested native/extension command | Purpose |
|---|---|---|
| Right Shift twice | Workmode | All modes and actions |
| Right Option twice | Window Layout | Arrange without quitting apps |
| Right Command twice | Clipboard History | Reuse copied material |

A live recording attempt was blocked by the computer-control tool: it rejects
modifier-only key presses (`keyPressIncludedNoNonModifierKeys`). Workmode still
shows Record Hotkey; no double-tap binding was added. Record these physically.

Start with one gesture and verify it during normal typing before adding the others.
Keep app launch bindings on Hyper so each app still has one shortcut. Keep focus
session actions behind the preview rather than starting app quits from a double tap.

Raycast documents double-tap modifiers and side-specific modifier keys. Verify the
right-side double-tap combination in the installed recorder, including that ordinary
modifier chords cancel a pending tap. No single-tap command should own the same key.
Double-tap Hyper is not verified: Caps Lock currently emits Escape when tapped, so
it should not be treated as an ordinary modifier double tap without a live test.

Source: [Raycast hotkey types](https://manual.raycast.com/command-aliases-and-hotkeys).

## What comes from Omarchy

The adaptation uses a single modifier layer, nearby app keys, predictable workspace
navigation and minus/equals resizing. Omarchy's Super+arrows changes directional
focus; this setup deliberately moves windows between Spaces, as requested.
Its Super+Shift layer cannot be copied literally: Hyper already includes Shift.
Distinct punctuation and the physical Meh layer avoid indistinguishable chords.
macOS Command shortcuts remain the base for application actions.

Sources: [Omarchy hotkeys](https://learn.omacom.io/2/the-omarchy-manual/53/hotkeys),
[Raycast Hyper](https://manual.raycast.com/hyper-key),
[native window management](https://manual.raycast.com/window-management).

## Finish recording and verify

1. In Raycast Settings, search **Move to Previous Space**. Open its hotkey cell,
   physically press Backspace to clear the partial assignment, then hold Control+Option
   and press comma. Confirm the comma is visible before enabling the command from
   its three-dot menu. Use Control+Option+period for Move to Next Space.
2. Record the remaining target window keys. Retain the Rectangle-style fractions listed above. Inspect extra quarter bindings
   for conflicts before keeping them.
3. With a disposable Finder window on Desktop 2, move it to 1 and back, then to 3
   and back. Confirm movement rather than just switching the visible Space.
4. Check both halves, thirds, two-thirds, maximize and restore. Check a second
   monitor only when connected; a single monitor cannot validate display movement.
5. Verify app keys, Codex B/V/M and launcher keys; then disable Rectangle Pro startup
   and quit it. Check that Karabiner is not intercepting keys. Repeat after login.

A further Control+Option+comma recording attempt also captured only modifiers.
This rules out treating fewer modifiers or punctuation as a proven fix for computer
control. It does not establish a Raycast restriction on those shortcuts.

The source map is generated by `node scripts/build-raycast-keymap.mjs`. Its tests
check collisions and action ownership; they do not prove native hotkey registration.
