# SDLC Loop Engineering

Apply this protocol to substantial SDLC work after `SDLC_METHOD.md`. SPEC-TS defines alignment and execution quality; this file defines orchestration, loop state, budgets and termination. Specialist safety, permission, evidence, and human-approval rules remain authoritative.

## Doctrine

1. Use simplest sufficient shape: one agent, prompt chain, bounded parallel sweep, then loop only when evidence justifies cost.
2. Parallelize independent reads, research, and evaluation. Serialize dependent decisions and all writes to shared checkout.
3. One root integrator owns objective, DAG, state, budgets, synthesis, permission boundaries, and termination.
4. Verification requires external evidence: code, tests, build logs, source records, artifact/configuration identity, standards, or runtime observation. Model agreement is not verification.
5. Keep generation, assessment, remediation, and verification separate where stakes warrant it.
6. Externalize durable state. Chat history and model memory are not authoritative workflow state.
7. Declare coverage, omissions, samples, caps, failures, retries, and budgets. Never imply completeness after silent truncation.
8. Humans retain product/architecture acceptance, risk acceptance, release, deployment, production mutation, incident command, and closure.

## Pattern Selection

| Agent/phase | Default loop pattern |
|-------------|----------------------|
| `build` | Route, gated chain, single-writer implementation, evidence integration |
| `sdlc` | Value alignment, loop-fitness decision, one optimal worker, stronger verifier, synthesis |
| `work-*` | One scoped implementation writer; no delegation or self-verification |
| `verify` | Cross-family read-only verification against evidence and value contract |
| `impact` | Small perspective panel only for material ambiguity; options, rubric, adversarial challenge |
| `architect` | 2-3 materially different options, fixed-rubric scoring, adversarial attack on provisional winner |
| `security` | Perspective-diverse passive sweep, contextual confirmation, fix contract, separate verifier |
| `quality` | Multi-modal evidence sweep, evaluator-optimizer, exact-tuple final gate |
| `operate` | Readiness chain; live incident uses bounded parallel evidence barrier under human Incident Commander |
| `pro` | Plan-execute-observe-replan with competing hypotheses and falsification |
| `quick` | Single linear loop only; escalate instead of fan-out |
| `ui` | Journey/state design, single writer, independent accessibility/performance/security/visual evaluators, bounded fix pass |
| `reviewer` | Parallel lenses when diff breadth warrants it, then refute each finding and run completeness critic |
| `research` | Map-reduce source collection, claim ledger, independent cross-check/refutation, confidence synthesis |
| `*-max` | One bounded adversarial challenge, never majority vote or approval |
| `*-fix` | One scoped writer under explicit contract; no self-verification |
| `*-verify` | Read-only evidence challenge against exact subject tuple |

Implementation is usually poor multi-agent work. Fan out only independent units with separate files/worktrees and stable contracts. One feature in one shared checkout stays single-agent.

## Loop Contract

Before looping, state:

- SPEC-TS ledger revision and Gate 1/Gate 2 state;
- objective and exact subject tuple;
- success/evaluation rubric and required evidence;
- stages, dependencies, writer ownership, and human gates;
- maximum rounds, tasks/agents, concurrency, fix attempts, duration, tokens/cost when measurable;
- retry policy, no-progress rule, stop states, and unresolved-output format.

## Stop And Alignment Directives

Root `sdlc` and external workflow runner honor exact directives:

- `[sdlc:stop]`, `[sdlc:pause]`, `[sdlc:human-gate]`
- `[sdlc:read-only]`, `[sdlc:plan-only]`, `[sdlc:no-loop]`, `[sdlc:single-agent]`, `[sdlc:no-web]`
- `[sdlc:worker=luna|sonnet|k3|glm]`
- `[sdlc:max-rounds=N]`, `[sdlc:max-agents=N]`, `[sdlc:max-cost-usd=N]`

External runs can also receive `ocwf --pause <run-id>` or `ocwf --stop <run-id>`. Control is checked between atomic worker calls; it cannot interrupt a model/tool call safely mid-action.

Each iteration follows:

1. **Observe** current state and evidence.
2. **Orient**: update assumptions, risks, and dependency graph.
3. **Choose** smallest next action or bounded parallel set.
4. **Act** with one writer per shared state.
5. **Verify** against fixed rubric and external evidence.
6. **Measure delta**: new verified findings, closed blockers, changed evidence/decision signature.
7. **Checkpoint** durable state and decide continue, replan, handoff, or terminate.

Replan when observation contradicts plan. Do not continue stale plan to preserve appearance of progress.

## Termination

- **Success**: required tasks and evidence gates pass for exact subject tuple.
- **Dry**: two consecutive complete coverage rounds produce zero new verified findings.
- **No progress**: open-finding/status/evidence signature is unchanged for two complete rounds after one strategy change.
- **Fix stagnation**: same failure signature after strategy change, or two failed fix attempts.
- **Budget exhausted**: declared task/round/time/token/cost cap reached. Report partial evidence; never relabel success.
- **Blocked**: missing human decision, authorization, dependency, external evidence, or unsafe conflict.
- **Failed**: worker or infrastructure failure remains after one bounded retry. Failed worker is never counted as empty/refuted.

OpenCode doom-loop detection is not semantic termination. Apply these rules explicitly.

## Depth-One Handoffs

Default OpenCode subagent depth is one. Root primary/all-mode session owns orchestration. Nested agent that needs sibling returns `<AGENT> HANDOFF REQUIRED` with:

- target agent;
- exact scoped task and subject tuple;
- inputs/evidence IDs and untrusted-content warning;
- constraints, permissions, expected output schema, stop condition;
- resume condition.

Root invokes sibling, then resumes original child by `task_id` with result. Child/max output must be normalized by owning specialist before root treats it as terminal state.

## Durable State

External workflows use append-only journal plus atomically replaced snapshot. Minimum state:

- run ID, workflow/version, objective, scope/non-goals, root agent, status, budgets;
- repository/worktree/source revision, release or incident tuple;
- task ID/stage/agent/dependencies/state/attempt/session/input-output hashes/error;
- content-addressed evidence with producer/tool/version/time/freshness/subject hash;
- findings, decisions, human owners/approvals;
- round, signature, new verified findings, closed blockers, stagnant rounds;
- termination state/reason/unresolved items.

Agents propose updates. Harness validates schema and owns state transitions. Raw evidence remains immutable; derived summaries reference evidence IDs.

Any direct interactive loop expected to exceed one round, survive compaction/interruption, or coordinate more than two specialist handoffs must use `ocwf` or maintain equivalent append-only journal plus atomic snapshot outside chat. A todo list or conversation memory alone is not durable workflow state.

## Context Discipline

- Give workers narrow questions, bounded scope, output schema, evidence standard, and stop condition.
- Return condensed result, not transcript. Preserve source/evidence IDs and uncertainty.
- Do not concatenate worker reports. Deduplicate, resolve contradictions, and synthesize against objective.
- If dependency context exceeds declared input budget, stop `BUDGET_EXHAUSTED`; never silently truncate.

## Prohibited Patterns

- Model-authored executable orchestration without fixed policy validation.
- Same-model majority voting presented as verification.
- Repeated identical prompts presented as independent attempts.
- Parallel writers in same checkout.
- `catch`/fallback that turns worker failure into empty success.
- Unbounded “until dry,” hidden top-N/sample caps, or unlimited retries.
- Autonomous release, deployment, production mutation, risk acceptance, or incident closure.
