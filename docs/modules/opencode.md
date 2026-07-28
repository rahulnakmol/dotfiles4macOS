# opencode

OpenCode configuration with file-based agent profiles and evidence-based model curation.

Full operator guide: [`docs/guides/opencode-sdlc.md`](../guides/opencode-sdlc.md) covers which agent/command/workflow to use, examples, handoffs, terminal states, and restart/deployment behavior.

## Files

| File | Target |
|------|--------|
| `.config/opencode/opencode.json` | `~/.config/opencode/opencode.json` |
| `.config/opencode/agents/*.md` | `~/.config/opencode/agents/*.md` |
| `.config/opencode/SDLC_METHOD.md` | `~/.config/opencode/SDLC_METHOD.md` |
| `.config/opencode/SDLC_LOOP.md` | `~/.config/opencode/SDLC_LOOP.md` |
| `.config/opencode/workflows/` | `~/.config/opencode/workflows/` |
| `.config/opencode/model-research.md` | `~/.config/opencode/model-research.md` |
| `.config/opencode/tui.json` | `~/.config/opencode/tui.json` |
| `.config/opencode/update-models.sh` | `~/.config/opencode/update-models.sh` |

## Configuration

- **Providers**: GitHub Copilot and OpenCode Go (authenticated)
- **Default agent/model**: `sdlc` on `github-copilot/gpt-5.6-sol` (`high`)
- **Small model**: `github-copilot/claude-haiku-4.5`
- **TUI theme**: Catppuccin with scroll acceleration

## Agent Profiles

Use decision table and detailed examples in [`opencode-sdlc.md`](../guides/opencode-sdlc.md). Summary:

| Agent | Model | Use Case |
|-------|-------|----------|
| `sdlc` | GPT 5.6 Sol (`high`, `xhigh` challenge) | Value-driven root orchestrator chooses no-loop, worker, specialist chain, workflow, or human gate |
| `build` | Claude Sonnet 5 | Default SDLC orchestrator and end-to-end implementation owner |
| `quick` | Kimi K3 | Clear, bounded, reversible implementation with hard escalation gates |
| `pro` | GPT 5.6 Sol | Difficult debugging, distributed behavior, migrations, performance, and high-risk execution |
| `impact` | GPT 5.6 Sol (`xhigh`, `max` escalation) | Research-led business/product outcomes, PRDs, value cases, services, and delivery pods |
| `architect` | Claude Opus 4.8 (`xhigh`, `max` review) | Azure/GCP technical architecture, diagrams, ADRs, and execution-ready stories |
| `security` | GPT 5.6 Sol (`xhigh`, `max` review) | Security architecture, vulnerability assessment, remediation, and verification |
| `quality` | GPT 5.6 Terra (`high`, `max` review) | Test strategy, evidence traceability, and independent release readiness |
| `operate` | GPT 5.6 Terra (`high`, `max` review) | SLOs, observability, incidents, DR, capacity, cost, and production readiness |
| `ui` | Claude Sonnet 5 | Product-interface design, frontend delivery, accessibility, security, and performance |
| `research` | GPT 5.6 Terra | Read-only technical research |
| `reviewer` | GPT 5.6 Terra | Read-only behavioral code review |
| `model-curator` | GPT 5.6 Sol | Deep-research model assignment maintenance |
| `work-luna` / `work-sonnet` / `work-k3` / `work-glm` | Luna / Sonnet / K3 / GLM 5.2 | Conditional one-writer implementation pool |
| `verify` | Claude Opus 4.8 (`xhigh`) | Cross-family higher-reasoning implementation verifier |

## SDLC Flow

`sdlc` aligns value and decides whether loop is justified. It chooses no loop, one Luna/Sonnet/K3/GLM worker, specialist chain, deterministic workflow, or human gate. `impact` frames outcomes and value. `architect` creates technical design and `READY` stories. One worker/build/pro/ui implements. Higher-reasoning cross-family `verify` challenges implementation. `security`, `operate`, and final `quality` supply assurance. Humans retain architecture/risk/release/deployment/incident authority.

All roles use SPEC-TS: Scope → Product Requirements → Engineering Constraints → Components → Trade-offs → Success Metrics. Shared mantra: design twice, verify alignment/design/outcome thrice, implement once per approved bounded slice.

Specialists can also be invoked directly with `/impact`, `/architect`, `/security`, `/quality`, and `/operate`.
Use `/sdlc` when route/worker/loop choice itself is unclear.
Select `build` or `quick` directly when implementation route is already clear; `sdlc` is read-only by design.

## Loop Engineering

`SDLC_LOOP.md` gives every agent shared routing, evidence, durable-state, budget, no-progress, depth-one handoff, and termination rules. Role-specific patterns preserve restraint:

- `quick`: single linear loop only
- `pro`: plan-execute-observe-replan
- `impact`: small perspective panel only for material ambiguity
- `architect`: option bake-off plus adversarial challenge
- `security`: passive multi-lens assessment, fix, cross-model verify
- `quality`: multi-modal evidence sweep and evaluator-optimizer
- `operate`: readiness chain or incident evidence barrier
- `ui`: single writer with bounded independent evaluators
- `reviewer`: perspective lenses, finding refutation, completeness critic
- `research`: map-reduce claims and source verification

OpenCode has no native dynamic-workflow DSL. `workflows/runner.mjs` supplies deterministic fixed templates over `opencode run --format json`, with append-only journal, atomic snapshots, content-hashed results, bounded concurrency/retries/rounds, resume, budget exhaustion, and semantic no-progress termination.

```bash
ocwfl                                      # List workflow templates
ocwfv                                      # Validate templates
ocwf deliver "Implement STORY-142" --dir "$HOME/project" --apply --check-json '["npm","test"]'
ocwf design "Design onboarding service"   # Impact → architecture → specialist challenge
ocwf review "Review current branch"       # Parallel lenses → finding refutation
ocwf assure "release_id=... source_revision=... artifact_digest=... provenance_id=... target_environment_id=... configuration_digest=... deployment_version=..."
                                             # Quality evidence → security → operations → final quality
ocwf maintenance "Find maintenance risk"  # Bounded loop-until-dry
ocwf --resume <run-id>                     # Resume interrupted run
```

Runner never passes `--auto`, never swallows failed workers, never treats model voting as verification, and never deploys or mutates production. `deliver` has one gated source writer and requires `--apply`; other bundled templates are read-only. Durable state lives under `${XDG_STATE_HOME:-~/.local/state}/opencode-workflows/`.

## Model Updater

```bash
~/.dotfiles/opencode/.config/opencode/update-models.sh            # Launch deep model-curator research
~/.dotfiles/opencode/.config/opencode/update-models.sh --dry-run  # Audit configured models and variants
```

The curator checks live provider catalogs, Models.dev reasoning-effort metadata, official release sources, capability fit, cost, deprecation, and provider availability before editing each model+variant pair. Workflow templates reference agent names rather than static models, so updates flow through agent assignments without template churn. It records decisions in `model-research.md`. `/update-models` runs the same agent inside OpenCode.

Quick uses requested Kimi K3 through authenticated OpenCode Go as `opencode-go/kimi-k3`.

Audit requires `curl`, `jq`, `awk`, and `perl`.

## Install

```bash
brew install opencode
stow opencode
```

## Shell Aliases

See `oc*` aliases in `zsh/.zshrc.d/aliases.zsh` and tmux `C-a o` key table.
