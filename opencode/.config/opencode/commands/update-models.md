---
description: Deep-research current model catalogs and update evidence-supported agent assignments
agent: model-curator
subtask: true
---

Audit and update OpenCode model assignments in canonical source `~/.dotfiles/opencode/.config/opencode` now. Do not edit copied runtime files under `~/.config/opencode` directly.

Run full model-curator workflow. Treat `$ARGUMENTS` as extra constraints (budget, provider, role, dry-run, or apply preference). Default to research plus evidence-supported edits; never assign unavailable IDs.
