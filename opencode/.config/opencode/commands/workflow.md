---
description: Apply bounded SDLC loop engineering interactively using simplest sufficient orchestration pattern
agent: build
---

Apply `SDLC_LOOP.md` to `$ARGUMENTS` inside this session.

Apply `SDLC_METHOD.md`: interactively clarify SPEC-TS, conduct Design Pass 1/2, verify Gate 1/2, then select simplest pattern and declare objective, subject tuple, stages, evidence, budgets and stops. Keep one writer and require Gate 3. Do not invoke external runner recursively; use `ocwf` for deterministic headless workflows.

Recognize and preserve `[sdlc:*]` stop/alignment directives. Prefer `/sdlc` when user needs orchestrator to decide whether loop is justified.
