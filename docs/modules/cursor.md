# Cursor

AI editor with global enterprise architecture rules for multi-cloud development.

## Deploy

```bash
stow cursor
```

This symlinks `~/.cursor/rules` to the `.cursor/rules/` directory in this repo, making the rules available across all projects in Cursor.

## What rules are included

| File | Scope | Purpose |
|------|-------|---------|
| `000-architecture-core.mdc` | Always | Core enterprise architecture principles |
| `100-python.mdc` | Python files | Python language conventions |
| `101-go.mdc` | Go files | Go language conventions |
| `102-dotnet.mdc` | .NET files | C# / .NET conventions |
| `103-typescript.mdc` | TypeScript files | TS/JS language conventions |
| `120-terraform.mdc` | Terraform files | Shared infrastructure patterns |
| `121-docker.mdc` | Docker files | Container discipline |
| `200-cloud-gcp.mdc` | Agent-requested | GCP runtime + services |
| `201-cloud-azure.mdc` | Agent-requested | Azure runtime + services |
| `300-agentic-ai.mdc` | Agent-requested | Agentic AI patterns |
| `301-power-platform-dynamics.mdc` | Solution files | Power Platform / Dynamics |
| `900-responsible-ai-governance.mdc` | Manual | Responsible AI governance |

## How the rules compose

Rules follow a numeric prefix system. Lower numbers are foundational; higher numbers refine them. Cursor applies rules based on their `globs` (file patterns) and `alwaysApply` settings.

For example, editing a Python file that uses Terraform on GCP will load:
`core (000) + python (100) + terraform (120) + gcp (200)`.

## Where Cursor stores config

- **Global rules** (this module): `~/.cursor/rules/*.mdc` — apply to every project.
- **Project rules**: `.cursor/rules/*.mdc` inside a repo — scoped to that codebase.
- **User rules**: Stored in Cursor Settings → Rules. Not version-controlled.
- **CLI config**: `~/.cursor/cli-config.json` — machine-specific, not committed.

See [Cursor Rules docs](https://cursor.com/docs/rules) for full details.

## Maintaining rules

If you find yourself correcting Cursor on the same topic twice, extract it into a new focused `.mdc` file rather than swelling an existing one. Keep the always-on core (`000`) under roughly 200 words, since every token there is spent on every request.
