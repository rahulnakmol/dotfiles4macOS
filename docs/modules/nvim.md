# nvim

Neovim with LazyVim framework and Catppuccin Macchiato colorscheme.

## Files

| File | Target |
|------|--------|
| `.config/nvim/init.lua` | `~/.config/nvim/init.lua` |
| `.config/nvim/lua/config/lazy.lua` | Bootstrap lazy.nvim |
| `.config/nvim/lua/config/options.lua` | Custom options (stub) |
| `.config/nvim/lua/config/keymaps.lua` | Custom keymaps (stub) |
| `.config/nvim/lua/config/autocmds.lua` | Custom autocmds (stub) |
| `.config/nvim/lua/plugins/colorscheme.lua` | Catppuccin Macchiato setup |
| `.config/nvim/stylua.toml` | Lua formatter config |
| `.config/nvim/.neoconf.json` | LSP plugin config |

## Setup

Based on the [LazyVim starter](https://www.lazyvim.org/installation) template with Catppuccin colorscheme added.

```bash
stow nvim
nvim              # LazyVim auto-installs plugins
:checkhealth      # Verify everything works
```

## Customization

- Add plugins in `lua/plugins/` — each `.lua` file is auto-loaded
- Configure options in `lua/config/options.lua`
- Add keymaps in `lua/config/keymaps.lua`
- LazyVim extras can be enabled via `:LazyExtras`

## Dependencies

```bash
brew install neovim stylua
```

Requires Neovim 0.10+.
