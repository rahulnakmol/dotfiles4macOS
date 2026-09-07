---
paths: "**/gcp/**,**/infra/gcp/**,**/*.gcp.tf,**/cloudbuild.yaml,**/cloudbuild.yml"
---


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
