# Start here — macOS setup

Choose FDE (full developer environment) or TF (Tech Founder). Both install Zen, Claude Desktop, Cursor and ChatGPT/Codex. FDE also includes T3 Code. Amp and Chrome Canary are optional. Setup targets Apple Silicon Macs.

## One command

Download the installer and run your chosen profile in Terminal. Run it as your normal user, without sudo.

```sh
curl -fL https://raw.githubusercontent.com/rahulnakmol/dotfiles4macOS/main/install.sh -o /tmp/dotfiles-install.sh && bash /tmp/dotfiles-install.sh --profile fde
```

For TF, replace `fde` with `tf`. Add `--productivity` to opt into Alfred, Karabiner, Rectangle Pro, DockFlow and Session integration. Without that flag, setup installs and Stows core configuration only.

## Double-click option

Download the repository from GitHub using **Code → Download ZIP**, extract it, and open the `setup` folder. Choose exactly one launcher:

| Launcher | Installs |
| --- | --- |
| FDE.command | FDE core apps and configuration |
| TF.command | TF core apps and configuration |
| FDE-Productivity.command | FDE plus optional productivity setup |
| TF-Productivity.command | TF plus optional productivity setup |

From a ZIP, the launcher clones the repository into ~/.dotfiles. From a Git checkout, it uses that checkout without changing its branch or pulling updates. A download may require macOS confirmation before it can run; review the source and use the Terminal command above if preferred. The launcher keeps Terminal open to show any failure or next step.

## What happens automatically

1. Verify macOS, Apple Silicon and Apple Command Line Tools. If Tools are missing, open Apple's installer and pause; complete it and rerun.
2. Install missing Homebrew through the official interactive installer. Enter any administrator password directly in its prompt.
3. Install Git, Node and Stow, and clone only if the chosen destination is absent.
4. Run profile plan, apply and check. Conflicting files stop installation; existing managed settings receive a backup and rollback command. Only missing packages are installed.
5. Open the matching GitHub manual and print its link, even when some checks remain pending.

Re-running checks the real state again and skips installed prerequisites. Progress is recorded at ~/.local/state/dotfiles/onboarding/fde.log or tf.log. No passwords, tokens or app history are recorded. A successful configuration check does not mark manual app setup complete.

Preview without installing or writing anything:

```sh
bash install.sh --profile fde --plan
```

Use `--no-open` to print the GitHub link without opening a browser, or `--directory PATH` for an existing checkout. Existing checkouts are never reset, adopted, pulled or switched automatically. Pull reviewed updates yourself before rerunning.

## Manual steps by profile

- [FDE human checklist](profiles/fde.md#finish-setup-human-checklist)
- [TF human checklist](profiles/tf.md#finish-setup-human-checklist)
- [Manual Stow without productivity automation](guides/setup.md)

The profile checklists cover app onboarding, Zen as default browser, optional licenses and permissions, Session categories, native Rectangle and DockFlow imports, desktop assignments and physical keyboard checks. They link to detailed instructions further down each manual.

The installer never activates licenses, handles account credentials, grants permissions, starts a focus timer or quits your apps. Karabiner uses the official DMG/PKG steps; Session must be the focus timer, not the unrelated Homebrew messenger.

Exit code 0 means managed checks passed, 2 means a human step or check remains, and 1 means a setup error. For rollback, use the exact backup command printed by profile apply, then restore native app imports separately as described in the profile manual.
