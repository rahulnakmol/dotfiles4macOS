# OpenCode SDLC Workflows

Deterministic orchestration over `opencode run --format json`. OpenCode has no native workflow DSL; this runner supplies fixed templates, bounded parallelism, durable state, and semantic termination outside model context.

Workflows apply `SDLC_METHOD.md`: SPEC-TS ledger, two design passes, Gate 1/Gate 2 before mutation, one writer, and independent Gate 3. Headless runs cannot ask user interactively; missing decision-changing input returns `NEEDS_INPUT`/`BLOCK` and must be resumed after clarification.

## Usage

```bash
node ~/.config/opencode/workflows/runner.mjs --list
node ~/.config/opencode/workflows/runner.mjs --validate
node ~/.config/opencode/workflows/runner.mjs design "Design a customer onboarding service" --dir ~/project
node ~/.config/opencode/workflows/runner.mjs deliver "Implement approved STORY-142" --dir ~/project --apply --check-json '["npm","test"]'
node ~/.config/opencode/workflows/runner.mjs review "Review current branch against main" --dir ~/project
node ~/.config/opencode/workflows/runner.mjs assure \
  "release_id=... source_revision=... artifact_digest=... provenance_id=... target_environment_id=... configuration_digest=... deployment_version=..." \
  --dir ~/project
node ~/.config/opencode/workflows/runner.mjs maintenance "Find verified maintenance risks" --dir ~/project
node ~/.config/opencode/workflows/runner.mjs --resume <run-id>
node ~/.config/opencode/workflows/runner.mjs --pause <run-id>
node ~/.config/opencode/workflows/runner.mjs --stop <run-id>
node ~/.config/opencode/workflows/runner.mjs --resume <run-id> --approve-human-gate \
  --approval-owner <human-id> --approval-rationale "reason" --approval-evidence <record-id>
```

Shell aliases in dotfiles: `ocwf`, `ocwfl`, `ocwfv`.

Default runs are read-only. `--apply` only permits tasks explicitly marked `mutates_workspace: true`; bundled templates contain no mutating tasks. Runner never passes OpenCode `--auto`.

Exception: `deliver` contains one conditional mutating worker task and requires `--apply` plus at least one `--check-json` array command. Orchestrator selects exactly one allowlisted worker (`work-luna`, `work-sonnet`, `work-k3`, or `work-glm`); workers never run in parallel on shared checkout. Harness records check exit/duration/output hashes. Gate 3 verifier is read-only, higher-reasoning and cross-family.

State lives at `${XDG_STATE_HOME:-~/.local/state}/opencode-workflows/<run-id>/`:

- `journal.jsonl`: append-only transitions
- `snapshot.json`: atomically replaced current state
- `results/`: content-hashed validated agent envelopes

## Safety

- Fixed declarative templates only; no model-authored JavaScript execution.
- One writer at a time. Separate worktrees required for independent write lanes.
- Worker failure remains failure; never converted to empty result.
- Read-only workers have edit/bash/task/external-directory denied through runtime agent override.
- Hard budgets and explicit `BUDGET_EXHAUSTED`, `NO_PROGRESS`, `BLOCKED`, or `FAILED` states.
- Token/cost budgets are enforced between worker calls; one in-flight call can exceed remaining budget and is reported as exhaustion before any next stage.
- Human approval remains required for architecture/risk/release/deployment/production/incident decisions.
