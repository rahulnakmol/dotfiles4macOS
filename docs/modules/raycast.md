# Raycast Workmode

Use Workmode to arrange your apps, switch the Dock and start a focus timer from
Raycast. This setup is optional, macOS-only, and shared by FDE and TF.

| I want to… | Read |
| --- | --- |
| Set up a Mac or fix a problem | [Setup guide](../guides/raycast.md) |
| Find a command, alias or hotkey | [Shortcut reference](raycast-hotkeys.md) |
| Build or change the extension | [Developer guide](../../extensions/raycast-workstation/README.md) |
| Understand what belongs in Workmode | [Design decision](../adr/0005-workmode-local-install.md) |

Start with the [prerequisites](../guides/raycast.md#install), then run this
from the dotfiles checkout:

```sh
bash scripts/setup-raycast-workstation.sh install
```

You can also double-click `setup/Raycast.command`. After **Importing Workmode**,
wait for **ready**, then press **Control+C**. Workmode stays installed.

The native ChatGPT/Codex alias (`cx`) and Workmode actions target bundle ID `com.openai.codex`.
Both subscription and gateway profiles share that ID, so these generic commands cannot distinguish
their processes. Use `chatgpt-subscription` and `chatgpt-aigateway` for profile launch; do not treat
Raycast focus as profile isolation.
