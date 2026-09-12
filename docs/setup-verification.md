# Setup wizard verification trace

The entry point is install.sh, with core and productivity launchers for FDE and TF under setup/. State is an append-only verification log at ~/.local/state/dotfiles/onboarding/{fde,tf}.log. Each run rechecks actual prerequisites rather than trusting earlier log entries. No secrets are stored.

Automated steps: verify platform and tools; run the official Homebrew installer if needed; install bootstrap tools; clone an absent checkout; run profile plan/apply/check; open the profile's GitHub human checklist. Profile apply retains its existing backup, conflict and rollback behavior.

Human-only steps: Apple Command Line Tools installation prompts; administrator credentials in the official Homebrew installer; app accounts, licenses and permissions; selecting the default browser; native Rectangle/DockFlow imports; Session categories; assigning desktops; physical keyboard and login checks. These require user interaction with macOS or licensed apps. The bootstrap never performs or claims to verify them.

Command Line Tools and Homebrew are verified by their commands on rerun. Profile check verifies managed state and dependency presence. Manual app setup remains explicitly unverified in the log and closing message; entering a confirmation is not treated as verification. The profile manuals specify observable acceptance checks.

Validation: Bash syntax checks cover all launchers. The installer preview was executed locally without installing or writing state. Dependency-isolated executable tests run through the first missing-Command-Line-Tools step and verify the banner, unverified state and resumption. They also cover fresh cloning, repeat runs, core-only defaults, productivity flag propagation, failed apply, pending checks and GitHub handoffs. Native Homebrew installation and end-to-end fresh-Mac GUI setup have not been exercised on this existing Mac.

Codex pet: the installed app bundle exposes openAvatarOverlay as an OS-global command, with one binding. Its hotkey handler invokes toggleFromHotkey. Hyper+B is the sole override and replaces Option+Space. Configuration and collision tests cover it; physical show/hide behavior still needs a user check while Codex is running.
