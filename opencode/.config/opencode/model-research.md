# Model Assignment Record

Last reviewed: 2026-07-23

## Active Assignments

| Role | Model | Evidence-based fit |
|------|-------|--------------------|
| Global/build/UI | `github-copilot/claude-sonnet-5` | Latest authenticated Sonnet; everyday coding, planning, and UI work |
| SDLC orchestrator | `github-copilot/gpt-5.6-sol` (`high`) | Frontier orchestration with lower default effort; escalates routing challenge to xhigh |
| SDLC orchestrator challenge | `github-copilot/gpt-5.6-sol` (`xhigh`) | Hidden challenge for consequential loop/worker decisions |
| SDLC workers | Luna `medium`; Sonnet `high`; Kimi K3 default; GLM 5.2 `high` | Cost/task-fit worker pool with one writer selected per workflow |
| SDLC verifier | `github-copilot/claude-opus-4.8` (`xhigh`) | Cross-family, higher-reasoning, read-only challenge against implementers |
| Pro/model curator/impact | `github-copilot/gpt-5.6-sol` (`xhigh`) | Latest authenticated frontier GPT; deep technical and cross-functional outcome reasoning |
| Impact critical escalation | `github-copilot/gpt-5.6-sol` (`max`) | Hidden maximum-effort challenger, invoked only for critical decisions |
| Architect | `github-copilot/claude-opus-4.8` (`xhigh`) | Top authenticated Claude tier for cross-cloud technical design, artifacts, and engineering decomposition |
| Architect critical review | `github-copilot/claude-opus-4.8` (`max`) | Hidden maximum-effort architecture red-team, invoked only for critical designs |
| Security | `github-copilot/gpt-5.6-sol` (`xhigh`) | Deep threat, vulnerability, cloud, supply-chain, and AI security reasoning |
| Security critical review | `github-copilot/gpt-5.6-sol` (`max`) | Hidden maximum-effort security red-team for critical exposure |
| Quality/operate | `github-copilot/gpt-5.6-terra` (`high`) | Cost-balanced independent release and production-readiness assurance |
| Quality/operate critical review | `github-copilot/gpt-5.6-terra` (`max`) | Hidden maximum-effort challenge for critical readiness and incidents |
| Security/quality/operate fixes | `github-copilot/claude-sonnet-5` (`high`) | Bounded implementation with strong coding and verification capability |
| Security/quality/operate verification | `github-copilot/claude-opus-4.8` (`high`) | Read-only cross-model evidence challenge, separated from assessor and fixer |
| Quick | `opencode-go/kimi-k3` | Authenticated multimodal Kimi with tools, reasoning, 1M context, 131K output, and long-horizon agent focus |
| Cavecrew | `github-copilot/gpt-5.6-luna` | Lowest-tier authenticated GPT 5.6 variant for focused, lower-cost work |
| Research/review | `github-copilot/gpt-5.6-terra` | GPT 5.6 capability with lower expected cost/latency than Sol |
| Small/system | `github-copilot/claude-haiku-4.5` | Fast authenticated model for titles and small tasks |

## Availability Decision

Requested Kimi K3 is available as `opencode-go/kimi-k3` through authenticated OpenCode Go. It was selected only after both `opencode models opencode-go` and Models.dev metadata confirmed exact ID, tool calling, reasoning, multimodal input, 1M context, and 131K output.

Claude Fable 5 exists in Models.dev/OpenCode public catalog metadata but is not exposed by authenticated OpenCode Go or GitHub Copilot on this machine. It remains an orchestrator candidate, not configured. Its published $10/$50 token pricing also exceeds GPT 5.6 Sol, so availability alone would not justify switching.

## Sources

- https://opencode.ai/zen/v1/models
- https://opencode.ai/docs/zen/
- https://models.dev/api.json
- Local `opencode models opencode`
- Local `opencode models opencode-go`
- Local `opencode models github-copilot`

## Next Review Triggers

- Active model disappears, becomes deprecated, or changes price/capability materially.
- New coding benchmark or production evidence shows role regression.
- New model family provides better role fit, not merely newer version number.
