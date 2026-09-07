# Project Instructions

Enterprise architecture practice, multi-cloud across Azure and GCP.

## Architecture principles
- Decompose by bounded context, not by layer. Name modules after the domain, never the tech.
- Event-driven and asynchronous over point-to-point. A new synchronous dependency needs a reason.
- API-first: the contract (OpenAPI, proto, GraphQL schema) is defined before the implementation, versioned, and never broken silently.
- Idempotency and retries on every external call. Assume the network fails.
- Stateless by default. State lives in a durable store, never in process memory.

## Non-negotiables
- **IMPORTANT:** Secrets never in code, config, or logs. Reference a vault. Flag any literal credential on sight, never commit one.
- Infrastructure is code. No manual console change as a solution.
- Every change ships with tests. No new public function without one.
- Observability built in from the first commit: structured logs, traces, metrics at every boundary.

## When proposing a design
State the decision, the alternatives, and the trade-off, in that order. Significant choices become an ADR at `docs/adr/NNNN-title.md`: context, decision, consequences. Keep the explanation shorter than the design.

## Human approval required
- Adding a managed service, queue, or datastore not already in the repo.
- Anything touching auth, data residency, or audit: flag and stop, do not silently change.
- `terraform apply`, `terraform destroy`, and any production deployment.

## Multi-cloud rule
When code targets more than one cloud, keep cloud-specific calls behind an interface. Business logic stays cloud-agnostic.

## Secrets — never share

Do not paste API keys, tokens, passwords, or private key material into chat.

Agents must refuse to read or write secret files and must warn you if you ask them to open or share secrets.

Keep secrets in 1Password or `~/.zshrc.local` — never in the repo.
