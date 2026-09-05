# Direct Stow management for Codex on macOS

Date: 2026-09-06. Status: implemented, revised to match the user's explicit request.

## Context

Codex configuration should be stored in dotfiles and linked with GNU Stow,
just like Claude's settings. The earlier split preferences/local merge design
did not meet that request.

## Decision

Store the actual current TOML at `codex/.codex/config.toml`. Stow it, keybindings,
hooks, global instructions, and the named command rules individually using
`--no-folding`. Keep runtime directories and credentials outside the module.
The backup helper handles existing-file conflicts; it does not merge preferences.

The TOML is directly editable. Only its clearly marked `permissions.dotfiles`
block is generated from the policy catalog. Shared instruction sources continue
to generate Claude and Codex adapters with equivalent engineering content.
Use the Homebrew ChatGPT app and its bundled Codex runtime, tested at 0.153.1+.

## Alternatives

- Split tracked preferences and a merged local config: rejected by the user;
  the actual TOML must be in Stow.
- Stow the entire home: rejected because runtime state and credentials do not
  belong in Git.

## Consequences

App edits can appear directly in Git. Some app saves may replace a symlink,
which the link check detects. Reconcile such edits before restowing.
The exact current Mac settings include machine-specific paths and project trust;
review these before deploying to another Mac. There is no undocumented local
include file or automatic portability promise. Permission semantics remain
client-specific and are documented in the module guide.

Backups stay outside Git, and rollback refuses to overwrite later edits.
Linux support is deferred.
