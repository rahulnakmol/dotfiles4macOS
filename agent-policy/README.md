# Agent policy catalog

Shared source of truth for Claude Code, Cursor, and OpenCode security/permission parity (A∪B).

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
