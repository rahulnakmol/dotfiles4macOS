# OpenCode SDLC Agent Guide

Use this guide to choose agent, slash command, or deterministic workflow. Detailed behavioral contracts live in `opencode/.config/opencode/agents/`, shared loop rules in `SDLC_LOOP.md`, and headless workflow details in `workflows/README.md`.

## Shared Method: SPEC-TS

Every SDLC agent uses `SDLC_METHOD.md`:

1. **S - Scope**: clarify problem, context, users/services, owner, boundaries, assumptions and non-goals.
2. **P - Product Requirements**: prioritize functional requirements, journeys, business rules and exceptions.
3. **E - Engineering Constraints**: quantify NFRs including security, resilience, throughput, data, observability, accessibility, cost and recovery.
4. **C - Components**: define responsibilities, contracts, data/trust/failure boundaries, integrations, deployment and support.
5. **T - Trade-offs**: compare alternatives, consequences, evolution/migration, reversibility, cost and value.
6. **S - Success Metrics**: baseline, target, guardrails, evidence, owner, review window and continue/pivot/stop threshold.

Mantra: **Design twice. Verify alignment, design/tasks, and outcome three times. Implement once per approved bounded slice.**

- Interactive agents acknowledge goal and ask decision-changing questions; they research repository/current sources before asking discoverable facts.
- Nested/headless agents return `NEEDS_INPUT`, `BLOCK`, or handoff instead of inventing missing decisions.
- Gate 1 verifies alignment before execution. Gate 2 verifies Design Pass 2 and task readiness before mutation. Gate 3 independently verifies outcome after mutation.
- “Implement once” means one controlled write phase per approved slice. Invalid design returns to Design Pass 2; failed evidence creates a new explicit remediation slice, never hidden patching or weakened tests.
- Extreme ownership means owning clarity, evidence, handoff, quality and closure within authority. Humans still own architecture acceptance, risk, release, deployment and incident command.

## Quick Choice

| Need | Use | Why |
|------|-----|-----|
| Unsure which SDLC path/model/loop to use | `sdlc` or `/sdlc ...` | Value-driven root orchestrator chooses no loop, one worker, specialist chain, workflow, or human gate |
| Normal feature, fix, refactor, or repository task | `build` | Default SDLC orchestrator and implementation owner |
| Small, clear, reversible change | `quick` | Fast single-agent path with hard escalation gates |
| Difficult debugging, migration, concurrency, distributed failure, or performance | `pro` | Principal-level execution and replan loop |
| Frontend journey, component, interaction, accessibility, or visual implementation | `ui` | Product-interface and frontend specialist |
| Ambiguous business/product/service problem or PRD | `/impact ...` | Value, options, research, finite-resource and human-decision framing |
| Technical solution, ADRs, C4/ArchiMate/SVG, NFRs, cloud/data/integration design | `/architect ...` | Azure/GCP technical architecture and execution-ready stories |
| Threat model, security design, vulnerability assessment, or remediation | `/security ...` | Security architecture, contextual risk, fix and independent verification |
| Test strategy, story readiness, evidence, or release decision | `/quality ...` | Independent quality and exact-release evidence gate |
| SLOs, observability, incident, DR, capacity, cost, or production readiness | `/operate ...` | Reliability and operational-evidence specialist |
| Current docs/API/upstream/source research | `@research ...` | Read-only evidence and claim verification |
| Focused diff/PR/file review | `@reviewer ...` | Read-only behavioral review with finding proof |
| Multi-stage or multi-agent interactive work | `/workflow ...` | Applies loop engineering inside current OpenCode session |
| Deterministic, resumable, headless orchestration | `ocwf <template> ...` | Fixed DAG/loop, durable state, hard budgets and termination |

## Agent Types

- **Primary**: select directly in TUI; owns root session and can orchestrate specialists.
- **All**: select directly or invoke as subagent. Direct selection can orchestrate; nested invocation is depth-one leaf and returns handoff packages.
- **Subagent**: invoke with `@name` or let root agent call it.
- **Hidden**: internal max/fix/verify helper. Do not use as normal starting point.

## Primary Agents

### `sdlc` (default)

Use when task may cross product, architecture, implementation, assurance, and operations, or when you want system to decide whether multi-agent loop is worth cost.

`sdlc` is intentionally read-only. It routes work to one writer or returns handoff; this prevents orchestrator from approving and implementing its own plan. If you already know task is straightforward implementation, select `build` or `quick` directly to avoid orchestration overhead.

`sdlc` runs GPT 5.6 Sol at `high`; consequential routing can invoke hidden Sol `xhigh` challenge. It aligns business/user value, owner, baseline, acceptance, finite constraints, evidence, budgets, stop conditions, and human gates before selecting route.

For substantial work it shows SPEC-TS, questions/assumptions, Design 1, Design 2, Gate 1/2, selected writer, Gate 3, outcome state and human decisions.

Routes:

- `NO_LOOP`: answer/route once
- `SINGLE_WORKER`: choose one optimal implementation worker
- `SPECIALIST_CHAIN`: dependent impact/architecture/security/operations/quality flow
- `WORKFLOW`: deterministic `ocwf` template
- `HUMAN_GATE`: stop before commitment
- `STOP`: honor stop/budget/safety control

Worker pool:

| Worker | Model/effort | Use |
|--------|--------------|-----|
| `work-luna` | GPT 5.6 Luna `medium` | Small bounded routine changes |
| `work-sonnet` | Claude Sonnet 5 `high` | Default feature/frontend/general implementation |
| `work-k3` | Kimi K3 | Long-horizon, large-context, coherent multi-file work |
| `work-glm` | GLM 5.2 `high` | Open-model diversity and million-context broad/mechanical coding |

Workers are internal contract executors, not recommended direct starting agents. Start with `sdlc`, `build`, `quick`, `pro`, or `ui` for interaction/clarification.

One worker writes per checkout. Harness-owned checks are mandatory for `deliver --apply`. `verify` uses Claude Opus 4.8 `xhigh` for Luna/K3/GLM workers. When Sonnet writes, workflow uses GPT 5.6 Sol `xhigh` (`verify-gpt`) so verification stays cross-family. Both are read-only and do not approve release/risk/deployment.

Fable is not currently configured: it is absent from authenticated providers and published cost exceeds Sol. Model curator tracks it as candidate.

### `build`

Use for most engineering work. `build` classifies task, invokes only material specialists, implements with one writer, verifies evidence, and reports explicit completion state.

Good prompts:

```text
Add idempotency to invoice creation and verify duplicate-request behavior.
Implement STORY-142 from the approved architecture package.
Fix this failing integration test and trace the underlying defect.
```

Avoid using `build` as substitute for unresolved product or architecture decisions. It should route those to `impact` or `architect` first.

Typical states: `COMPLETE`, `COMPLETE WITH LIMITATIONS`, `BLOCKED`, `HANDOFF READY`.

### `quick`

Use only when outcome and acceptance are clear, change is bounded/reversible, existing pattern applies, and no new architecture/security/migration decision exists.

Good fits: typo, focused bug, small validation rule, routine test, local config adjustment.

Escalates instead of improvising when scope becomes ambiguous, cross-system, security-sensitive, migration-heavy, or release/production-related.

### `pro`

Use when shallow local changes are dangerous: distributed/concurrent behavior, cross-repository debugging, difficult migrations, performance/resource work, broad high-risk refactors, or deep remediation.

`pro` uses baseline → hypotheses → falsification → vertical slice → evidence → replan. It is implementation specialist, not replacement for `impact` or `architect` governance.

### `ui`

Use for product-interface and frontend delivery: journeys, hierarchy, components, state models, responsive behavior, accessibility, performance, security/privacy, visual consistency, and browser/device evidence.

For substantial UI work, expect state matrix, accessibility checks, viewport/browser coverage, performance and test evidence, screenshots/artifacts, limitations, and specialist handoffs.

## Specialist Agents And Commands

### `impact` and `/impact`

Use before building when problem is ambiguous or outcome depends on strategy, customer/service behavior, adoption, economics, operating model, automation, agentic pods, or finite resources.

Produces smallest useful set: decision brief, problem charter, evidence/trends, options, value case, PRD/service definition, delivery swimlanes, pod charter, measures, and human gates.

```text
/impact Should we automate claims triage, and where must human judgment remain?
/impact Turn this service problem into a PRD and phased delivery plan.
```

Normal effort is `xhigh`; critical decisions may trigger hidden `impact-max` at `max`.

### `architect` and `/architect`

Use when PRD/strategy needs technical solution across Azure/GCP, Python, .NET, TypeScript/JavaScript, Go, APIs/events, data, security, deployment, observability, resilience, scale, and throughput.

Produces relevant architecture views, HLD/LLD, C4, ArchiMate/BiZZdesign exchange, SVG/source diagrams, ADRs, transition/migration plan, and `READY`/`BLOCKED` vertical technical stories.

```text
/architect Design the approved onboarding PRD for Azure and GCP portability.
/architect Create C4, deployment, integration, logical-data views and ADRs.
```

ADR minimum: `Title`, `Context`, detailed `Decision`, `Consequences`, and `Business Value` rated `High`, `Medium`, `Low`, or `N/A` with rationale. ADRs remain `Proposed` until named human acceptance.

Normal effort is Claude Opus `xhigh`; critical designs may trigger hidden `architect-max` at `max`.

### `security` and `/security`

Use for security architecture, trust boundaries, auth/authorization, data/privacy, APIs, cloud/IaC, dependencies/supply chain, containers, AI/agentic security, threat modeling, vulnerability assessment, remediation, and verification.

Without explicit active-testing authorization (target, owner, environment, technique, rate/load, data handling, time window, stop conditions), security performs passive static review only.

```text
/security Threat-model this multi-tenant API and review ASVS controls.
/security Assess current branch for reachable vulnerabilities; passive only.
```

Security path: assess → confirm → remediation contract → hidden `security-fix` → parent/CI evidence → cross-model `security-verify` → final scoped disposition.

Possible dispositions: `NO BLOCKING FINDINGS IN REVIEWED SCOPE`, `BLOCK`, `EXCEPTION REQUIRED`, `INSUFFICIENT EVIDENCE`.

### `quality` and `/quality`

Use in two phases:

- **Before implementation**: `STORY READY` or `STORY BLOCKED` based on acceptance, dependencies, contracts/fixtures, NFRs, evidence plan, rollout and rollback.
- **After build**: final exact-release evidence integration after security and operations evidence.

Canonical release tuple:

```text
release_id
source_revision
artifact_digest
provenance_id
target_environment_id
configuration_digest
deployment_version | NOT_DEPLOYED
```

```text
/quality Review STORY-142 for implementation readiness.
/quality Assess release tuple ... and return final readiness.
```

Terminal release states: `READY`, `READY WITH ACCEPTED EXCEPTION`, `NOT READY`, `EXCEPTION REQUIRED`, `INSUFFICIENT EVIDENCE`.

### `operate` and `/operate`

Use for service ownership, SLO/error budgets, OpenTelemetry, alerts/runbooks, capacity/performance, backup/restore/DR, deployment safety, FinOps, toil, production readiness, incidents, and postmortems.

Operate never mutates production. Humans execute approved runbooks through operational systems.

```text
/operate Define SLOs, burn alerts, runbooks and capacity model for checkout.
/operate Assess operational evidence for release_id=...
/operate Structure incident evidence for INC-204; do not execute mitigation.
```

Release evidence states: `OPERATIONS EVIDENCE PASS`, `OPERATIONS EVIDENCE FAIL`, `EXCEPTION REQUIRED`, `INSUFFICIENT EVIDENCE`.

Incident flow: `DETECTED` → `DECLARED` → `MITIGATED` → `RESTORED` → `MONITORING` → `RESOLVED` → `CLOSED`. Agent recommends transitions; human Incident Commander confirms recovery/closure.

## Read-Only Helpers

### `@research`

Use for current primary-source research, release notes, schemas, APIs, upstream implementation, model metadata, and evidence-backed comparisons. Claims are marked verified/unverified/contradicted/stale with dates and confidence.

### `@reviewer`

Use for focused review of diff/branch/file. Broad/high-risk review should use `ocwf review` because subagent depth prevents reviewer from spawning parallel lenses itself.

### Cavecrew helpers

| Agent | Use |
|-------|-----|
| `@cavecrew-investigator` | Compressed read-only code location |
| `@cavecrew-builder` | Surgical 1-2 file edit only |
| `@cavecrew-reviewer` | Preliminary compressed review; parent must verify findings |

## Hidden Internal Agents

Do not select these as normal user-facing agents:

| Family | `-max` | `-fix` | `-verify` |
|--------|--------|--------|-----------|
| Impact | Critical maximum-effort challenge | N/A | N/A |
| Architect | Critical design red-team | N/A | N/A |
| Security | Critical exposure challenge | Bounded source remediation | Read-only cross-model verification |
| Quality | Critical evidence challenge | Bounded test/evidence remediation | Read-only cross-model verification |
| Operate | Critical reliability/incident challenge | Bounded source reliability fix | Read-only cross-model verification |

Root agent invokes hidden helper, then resumes owning specialist. Hidden helper output is not approval.

## Slash Commands

| Command | Use |
|---------|-----|
| `/sdlc <objective>` | Value-driven route/worker/loop selection |
| `/impact <problem>` | Business/product/service framing and PRD/value delivery |
| `/architect <PRD/design>` | Technical architecture, diagrams, ADRs and stories |
| `/security <scope>` | Security architecture/vulnerability assurance |
| `/quality <story/release>` | Story readiness or final release evidence |
| `/operate <service/release/incident>` | Reliability and operational evidence |
| `/workflow <objective>` | Interactive bounded loop engineering in current session |
| `/update-models [constraints]` | Deep-research agent model/variant assignments |
| `/caveman [lite|full|ultra|wenyan|off]` | Communication compression mode |
| `/caveman-help` | Caveman command card |
| `/caveman-commit` | Terse conventional commit message |
| `/caveman-review` | Compressed review format |
| `/caveman-compress <file>` | Compress Markdown memory file |
| `/caveman-stats` | Compression statistics |

## Interactive Loop Or External Workflow

Use `/workflow` when work remains interactive, human-guided, and likely fits current session.

Use `ocwf` when work needs deterministic DAG/loop, bounded parallel workers, durable state, resume, hard budgets, schema-validated outputs, and semantic termination.

| Template | Use | Shape |
|----------|-----|-------|
| `deliver` | Approved value-aligned implementation | SPEC-TS → Design 1 → Design 2 → Gate 1/2 → one Luna/Sonnet/K3/GLM writer → cross-family Gate 3 → Sol outcome synthesis |
| `design` | Consequential value-to-architecture work | Impact → architecture → parallel security/quality/operations challenge → synthesis |
| `review` | Broad/high-risk branch or design review | Parallel lenses → evidence-based finding refutation/completeness |
| `assure` | Exact release decision support | Quality evidence precheck → security → operations → final quality |
| `maintenance` | Periodic debt/risk sweep | Bounded multi-lens loop until two complete dry rounds or stop condition |

Examples:

```bash
ocwfl
ocwfv
ocwf deliver "Implement approved STORY-142" \
  --dir "$HOME/project" --apply \
  --check-json '["npm","test"]' \
  --check-json '["npm","run","lint"]'
ocwf design "Design a customer onboarding service" --dir "$HOME/project"
ocwf review "Review current branch against main" --dir "$HOME/project"
ocwf assure \
  "release_id=rel-42 source_revision=<sha> artifact_digest=<digest> provenance_id=<id> target_environment_id=staging configuration_digest=<digest> deployment_version=NOT_DEPLOYED" \
  --dir "$HOME/project"
ocwf maintenance "Find verified maintenance risks" --dir "$HOME/project"
ocwf --resume <run-id>
```

Bundled workflows are fixed-template and never pass `--auto`, deploy, or mutate production. `design`, `review`, `assure`, and `maintenance` are read-only. `deliver` permits exactly one conditional source writer and requires `--apply` plus at least one array-form `--check-json`; shell strings are not accepted. State is under `${XDG_STATE_HOME:-~/.local/state}/opencode-workflows/<run-id>/`.

### Stop And Alignment Controls

Add exact directives to request:

```text
[sdlc:stop] [sdlc:pause] [sdlc:human-gate]
[sdlc:read-only] [sdlc:plan-only] [sdlc:no-loop] [sdlc:single-agent]
[sdlc:no-web] [sdlc:worker=luna|sonnet|k3|glm]
[sdlc:max-rounds=N] [sdlc:max-agents=N] [sdlc:max-cost-usd=N]
```

For active external run:

```bash
ocwf --pause <run-id>
ocwf --stop <run-id>
ocwf --resume <run-id> --approve-human-gate \
  --approval-owner <human-id> \
  --approval-rationale "approved reason" \
  --approval-evidence <ticket-or-record-id>
```

Pause/stop takes effect between atomic worker calls, not in middle of model/tool call.

## Standard SDLC Paths

### New Product Or Service

```text
sdlc → impact → architect + quality story gate → one implementation worker/build/pro/ui → verifier/security → operate → final quality → human release/launch
```

### Small Fix

```text
quick → focused test → diff review
```

Escalate if boundary, security, migration, or production concern appears.

### Complex Defect Or Migration

```text
pro → reproduce/hypotheses → implementation → security/operate evidence as needed → final quality
```

### Vulnerability

```text
security → confirmed finding/contract → security-fix or build/pro → parent/CI evidence → security-verify → security disposition → quality release decision
```

### Incident

```text
operate evidence barrier → human IC mitigation → sustained observation → security if cyber → postmortem → impact/architect/build/quality actions
```

## Handoffs And Stop States

OpenCode subagent depth defaults to one. Nested specialist returns `<AGENT> HANDOFF REQUIRED`; root invokes sibling, then resumes original specialist by `task_id`.

Never treat these as approval:

- `BLOCK`, `BLOCKED`, `STORY BLOCKED`, `NOT READY`
- `OPERATIONS EVIDENCE FAIL`
- `EXCEPTION REQUIRED`, `INSUFFICIENT EVIDENCE`
- `PARTIAL`, `UNVERIFIED`, `REMEDIATION FAILED`
- `MAX ... REQUIRED`, `<AGENT> HANDOFF REQUIRED`
- Child states such as `CONTAIN`, `REMEDIATE`, `MITIGATE`, `ESCALATE`

Human approval remains required for architecture acceptance, risk acceptance, release, deployment, production mutation, incident command, and closure.

## Installation And Restart

OpenCode loads configuration once. Restart after changing agents, commands, skills, plugins, or `opencode.json`.

Canonical source is `~/.dotfiles/opencode/.config/opencode`. Validate directly without relying on deployed copy:

```bash
XDG_CONFIG_HOME="$HOME/.dotfiles/opencode/.config" opencode agent list
ocwfv
ocumd
```

This machine currently has copied files under `~/.config/opencode`, which can conflict with GNU Stow. Do not use destructive replacement casually; resolve deployment ownership before assuming repository changes are live.
