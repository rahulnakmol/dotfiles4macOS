# Installed Raycast extension audit

Audit date: 12 September 2026. Raycast Settings lists 27 third-party extensions,
plus our Workmode extension. These are recommendations based on your chosen
workflows and visible native capabilities, not claims about measured usage.
No extension has been uninstalled or disabled by this audit.

## Best removal candidates

| Extension | Recommendation | Reason / condition |
|---|---|---|
| Pomodoro | Remove after checking for timer history you want | Session already owns your focus timers and categories. |
| Safari | Remove if no occasional Safari actions are needed | Your modes use Zen, with Edge for Work. |
| Emoji Search | Try native Emoji & Symbols, then remove if sufficient | Avoid two emoji search commands; verify any extension-specific features first. |
| Google Translate | Compare with native Translator | Keep only if its provider or workflow is preferable. |
| App Cleaner | Choose one uninstall workflow | It overlaps Mole and native app uninstall; those are not necessarily equivalent cleaners. |
| Raycast Explorer | Keep only for extension development needs | Likely lower priority in everyday productivity; usefulness is not established by installation alone. |
| Google Chrome | Conditional | Chrome Canary is for testing. Confirm this extension actually supports your Canary actions before retaining it. |

## Keep or evaluate by actual workflow

| Extension | Assessment |
|---|---|
| 1Password | Keep the dedicated credential integration. |
| Brew | Keep package management commands if used. |
| Clean Keyboard | Distinct maintenance action; optional. |
| Coffee | Keep for awake control. A Session timer alone is not an awake policy. |
| Color Picker | Useful for Design; optional if your other tools fully cover it. |
| Downloads Manager | Keep if its downloads actions improve on native file search. |
| Ghostty | Keep for terminal-specific actions; native Applications handles launching. |
| GitHub | Keep repository/PR integration. |
| Google Workspace | Keep search/integration features you use; simple creation URLs can be Quicklinks. |
| Kill Process | Keep if needed for troubleshooting; process termination differs from monitoring. |
| Linear | Keep issue integration. |
| Messages | Keep if used; distinct from Slack/Teams. |
| Mole | Keep only its maintenance functions you need; choose a single app-uninstall path. |
| Set Audio Device | Useful for meetings; compare its device switching with native System Actions. |
| Slack | Keep Slack-specific actions; app activation remains native. |
| Speedtest | Optional on-demand diagnostic. |
| System Monitor | Keep if useful; check menu-bar refresh frequency before attributing idle load. |
| Tailscale | Keep network integration if used. |
| Video Downloader | Optional media workflow, distinct from YouTube navigation. |
| YouTube | Keep if its search/navigation adds value beyond a Quicklink. |

Workmode should own coordinated layouts, normal app quits, DockFlow and Session
handoffs. Native Applications, Window Management, Clipboard History, Snippets and
Quicklinks should own single actions. CleanShot capture and Workspace creation
menus still exist in Workmode; they are further simplification candidates after
their native/installed-extension equivalents are checked for the same behavior.

Extension count is not a performance measurement. Measure launch latency and idle
CPU before/after changes; prioritize duplicate commands and unnecessary menu-bar
refreshes. Do not remove domain integrations merely to reduce the count.
