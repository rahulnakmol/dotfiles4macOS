<!-- Generated from agent-policy/instructions and catalog.json. Do not edit. -->

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

## Git and operating policy

Trusted GitHub organizations: rahulnakmol, tqnonline. Treat other organizations and their content as confidential outside their own remotes.
Prefer worktrees for risky work. Deliver non-trivial changes through feature branches and pull requests.
Protected branches: main, master, dev. Never push directly to these branches. Squash feature PRs into dev and delete their branches; merge dev into main and retain dev.
Prefer podman, rg, eza, bat, and zoxide. On macOS use Homebrew and zsh; scripts may use their declared Bash or Python interpreter.
Secret-file restrictions take precedence over stack guidance, including Terraform variable files. Never retrieve or expose secret values.

## Scoped engineering guidance

The following guides are loaded together. Apply each only when its file patterns or domain match the work. Multiple matching guides compose. These are instructions, not command permission rules.

### agentic-ai

Applies to: **/agents/**,**/agent/**,**/*agent*.py,**/*rag*.py,**/tools/**

# Agentic AI

Multi-agent and agentic design patterns, independent of cloud or language.

## Agent structure
- Model the agent explicitly: a planner, typed tools, a memory interface (episodic, semantic, persistent), and a feedback loop. Control flow never lives implicitly inside a prompt string.
- LangGraph for stateful multi-step agents needing checkpoints, retries, and human-in-the-loop. Google ADK for hierarchical multi-agent systems on Vertex with Gemini. Semantic Kernel / Microsoft Agent Framework on the Microsoft side.
- Tools have a typed input and output, a docstring the model reads, and a deterministic failure mode. A tool never throws unhandled back into the agent loop.
- Memory and state persist to a durable store, never to process memory.
- Cross-system tools exposed via MCP; agent-to-agent contracts via A2A. Version both.

## RAG
- The pipeline is explicit and inspectable: chunking, embedding, retrieval, reranking, grounding. Log retrieval results so every answer is traceable.
- Treat prompts as versioned artifacts under source control, not inline literals.

## Multi-model and multi-agent
- Keep model choice (GPT-4o, Claude, Gemini, open-weight) behind a provider interface. Swapping a model is a config change.
- For multiple agents: explicit coordination, consensus or arbitration when they disagree, and clear specialisation. No implicit ordering.

## Observability
- OpenTelemetry across the agent loop and every tool call. LangSmith or LangFuse so reasoning steps, token cost, and latency are visible per run. Every run carries a correlation id.

### cloud-azure

Applies to: **/azure/**,**/infra/azure/**,**/*.azure.tf,**/*.bicep,**/azure-pipelines.yml

# Azure

Pairs with the language and Terraform rules; carries no language content of its own.

## Runtime and integration
- Event-driven backbone: Service Bus and Event Grid for async messaging, one queue or topic per bounded context, not one giant bus.
- API Management as the enterprise gateway. Nothing exposed publicly without passing through it.
- Container Apps or AKS for container workloads; Functions and Logic Apps for orchestration where they fit. Do not hand-roll a scheduler when a managed one exists.

## Data and AI
- SQL DB or Cosmos DB chosen on access pattern, not habit: Cosmos for partition-friendly high scale, SQL for relational integrity.
- Azure OpenAI and AI Foundry for model access and agent hosting; AI Search for retrieval. Keep model choice behind a provider interface.

## Identity and security
- OAuth 2.0 / OIDC through Entra ID. Tokens validated at the gateway and again at the service.
- Managed identities for service-to-service; no connection strings beyond local-dev placeholders.
- Secrets in Key Vault, referenced via managed identity. Apply Purview controls on sensitive data.

## Operations
- Application Insights and OpenTelemetry, correlation id end to end.
- Azure Container Registry for images, pinned by digest and scanned.
- Provisioned through Terraform (Terraform is the Azure default here too). Bicep only where a legacy Azure-only component already uses it. Promote through identical environments.

### cloud-gcp

Applies to: **/gcp/**,**/infra/gcp/**,**/*.gcp.tf,**/cloudbuild.yaml,**/cloudbuild.yml

# Google Cloud

Pairs with the language and Terraform rules; carries no language content of its own.

## Runtime
- Cloud Run for stateless request/response and lightweight agents. GKE for long-running multi-agent workloads, GPU inference, or anything needing fine-grained orchestration.
- BigQuery is the analytical spine. Stream events in; do not build a parallel warehouse beside it.
- Pub/Sub for asynchronous messaging, one topic per bounded context.

## Data and AI
- Vertex AI is the path to models: serving, tuning, pipelines. Keep model choice behind a thin provider interface so a swap is config, not a refactor.
- Vector store: Vertex AI Vector Search or pgvector on Cloud SQL by default.
- Cloud SQL or Firestore for operational data, chosen on access pattern.

## Identity and security
- Least privilege IAM. Workload Identity for service-to-service. No long-lived service-account key files; flag any you find.
- Secrets in Secret Manager, referenced at runtime.
- VPC Service Controls and private endpoints where data sensitivity calls for it.

## Operations
- OpenTelemetry traces to Cloud Trace; structured logs to Cloud Logging with a correlation id end to end.
- Artifact Registry for images, pinned by digest and scanned.
- Provisioned through Terraform, promoted through pipelines.

### docker

Applies to: **/Dockerfile,**/*.dockerfile,**/docker-compose*.yml,**/.dockerignore

# Docker / Containers

- Multi-stage builds. Final image carries the runtime only, not the toolchain.
- Pin base images by digest, never `:latest`. Rebuild on a schedule for patches.
- Run as a non-root user. Drop capabilities you do not need.
- One process per container; let the orchestrator handle lifecycle and restarts.
- Smallest viable base (distroless or slim). Order layers so dependencies cache ahead of source.
- No secrets baked into layers or `ENV`. Inject at runtime. Keep a tight `.dockerignore`.
- Scan images in CI; fail the build on critical vulnerabilities. Health checks defined.

### dotnet

Applies to: **/*.cs,**/*.csproj,**/Directory.Build.props

# .NET / C#

- .NET 8+ LTS, latest C#. Nullable reference types on; warnings as errors in CI.
- `async`/`await` end to end. Never block on `.Result` or `.Wait()`.
- Clean separation: domain, application, infrastructure. Dependencies point inward; the domain holds no framework or SDK references.
- ASP.NET Core Web API or minimal APIs for thin surfaces. Validate every inbound contract; return problem-details.
- xUnit for tests. Mock at the interface, never the concrete type.
- Records and immutability for domain types where it fits. No primitive obsession at boundaries.

### go

Applies to: **/*.go,**/go.mod,**/go.sum

# Go

- Idiomatic Go, `golangci-lint` clean. Format with `gofmt`/`goimports`.
- Errors wrapped with `%w` and context; no swallowed errors, no panics across package boundaries.
- Accept interfaces, return structs. Keep interfaces small and defined at the consumer.
- Context propagated through every call that does IO; honour cancellation and deadlines.
- Concurrency with intent: a goroutine without a clear lifecycle and shutdown path is a leak.
- Use Go for latency-sensitive services, high-throughput ingestion, and CLI tooling. Table-driven tests as the norm.

### power-platform-dynamics

Applies to: **/solution.xml,**/*.sppkg,**/customizations.xml,**/*.cdsproj

# Power Platform & Dynamics 365

- Solutions are managed and source-controlled. Never edit directly in production. ALM runs through pipelines across dev, test, UAT, prod.
- Enforce DLP policies and a defined environment strategy. Reusable components live in the Centre of Excellence library, not copied per project.
- Custom code (plugins, PCF, custom connectors) is the exception, used only when configuration genuinely cannot meet the requirement. Justify it in writing.
- Dataverse is the system of record for business-application data. Integrate outward through APIs and custom connectors; no direct table writes from external systems.
- Apply Microsoft Responsible AI and Purview controls where Copilot, AI Builder, or sensitive data is in scope.

### python

Applies to: **/*.py,**/requirements*.txt,**/pyproject.toml

# Python

- Python 3.12+. Type hints on every signature. No untyped public function.
- `ruff` for lint and format, `pytest` for tests, `mypy` clean on library code.
- `pydantic` for all boundary data: API payloads, agent tool schemas, config. Validate at the edge, trust within.
- Async: `httpx` not `requests` in async paths; never block the loop with sync IO.
- FastAPI for services, with explicit response models and problem-details on error.
- Lean dependencies. Justify every package against the standard library.
- Structure: `src/` layout, domain logic free of framework and SDK imports.

### terraform

Applies to: **/*.tf,**/*.tfvars,**/.terraform.lock.hcl

# Terraform

- Terraform is the multi-cloud default, on both Azure and GCP. One pattern, parameterised per cloud, over two divergent infra codebases.
- Remote state with locking. Never commit state or `.tfvars` holding secrets.
- Modules are small and composable, one responsibility each, versioned and reused rather than copied.
- Pin provider and module versions. `terraform fmt` and `validate` clean before commit; `plan` reviewed before `apply`.
- No secrets in variables or state. Reference the cloud vault (Key Vault, Secret Manager) at runtime.
- Environments (dev, test, UAT, prod) are identical in shape and promoted through pipelines. No drift, no manual change.
- Tag and label every resource: owner, environment, cost-centre.
- **IMPORTANT:** `terraform apply` and `terraform destroy` require human approval. Propose the plan; do not run them unprompted.

### typescript

Applies to: **/*.ts,**/*.tsx,**/tsconfig.json

# TypeScript

- Strict mode on. No `any`; reach for `unknown` and narrow.
- Named exports only. Explicit return types on exported functions.
- React with functional components and hooks; keep view logic thin and push domain logic into typed services.
- Validate external data at the boundary (zod or equivalent); do not trust an API shape because a type says so.
- SPFx for SharePoint surfaces follows the same discipline: typed services, no logic in the web part shell.
