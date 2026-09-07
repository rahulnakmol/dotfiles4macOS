---
paths: "**/*.ts,**/*.tsx,**/tsconfig.json"
---


# TypeScript

- Strict mode on. No `any`; reach for `unknown` and narrow.
- Named exports only. Explicit return types on exported functions.
- React with functional components and hooks; keep view logic thin and push domain logic into typed services.
- Validate external data at the boundary (zod or equivalent); do not trust an API shape because a type says so.
- SPFx for SharePoint surfaces follows the same discipline: typed services, no logic in the web part shell.
