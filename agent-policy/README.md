# Agent policy catalog

Shared source of truth for Claude Code, Cursor, OpenCode, and Codex policy intent.
Enforcement mechanisms differ; see [Codex coverage](../docs/modules/codex.md#enforcement-boundaries).

| File | Role |
|------|------|
| `catalog.json` | Secrets globs, shell allow/ask/deny hints, trusted git orgs, adapter paths |
| `warning.md` | Always-on user warning text (must appear in each tool’s instructions) |

## Apply / validate

```bash
node scripts/apply-agent-policy.mjs    # rewrite adapters from catalog
node scripts/validate-agent-policy.mjs # exit 0 only if adapters match catalog
```

After editing the catalog or adapters, run validate and fix until it exits 0.

`instructions/core.md` and the ten stack guides are the shared source for Claude
and Codex. `node scripts/apply-agent-policy.mjs --codex-only` refreshes those
instruction adapters and Codex config/rules without rewriting other clients'
permission settings. Generated adapters are checked into Git and validated in CI.

Cursor's generated policy-only files are now tracked so clean clones pass parity
validation. Do not add runtime or credential fields to those files.
