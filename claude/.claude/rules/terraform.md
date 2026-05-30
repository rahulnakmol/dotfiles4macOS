---
paths: "**/*.tf,**/*.tfvars,**/.terraform.lock.hcl"
---


# Terraform

- Terraform is the multi-cloud default, on both Azure and GCP. One pattern, parameterised per cloud, over two divergent infra codebases.
- Remote state with locking. Never commit state or `.tfvars` holding secrets.
- Modules are small and composable, one responsibility each, versioned and reused rather than copied.
- Pin provider and module versions. `terraform fmt` and `validate` clean before commit; `plan` reviewed before `apply`.
- No secrets in variables or state. Reference the cloud vault (Key Vault, Secret Manager) at runtime.
- Environments (dev, test, UAT, prod) are identical in shape and promoted through pipelines. No drift, no manual change.
- Tag and label every resource: owner, environment, cost-centre.
- **IMPORTANT:** `terraform apply` and `terraform destroy` require human approval. Propose the plan; do not run them unprompted.
