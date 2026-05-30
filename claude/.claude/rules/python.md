---
paths: "**/*.py,**/requirements*.txt,**/pyproject.toml"
---


# Python

- Python 3.12+. Type hints on every signature. No untyped public function.
- `ruff` for lint and format, `pytest` for tests, `mypy` clean on library code.
- `pydantic` for all boundary data: API payloads, agent tool schemas, config. Validate at the edge, trust within.
- Async: `httpx` not `requests` in async paths; never block the loop with sync IO.
- FastAPI for services, with explicit response models and problem-details on error.
- Lean dependencies. Justify every package against the standard library.
- Structure: `src/` layout, domain logic free of framework and SDK imports.
