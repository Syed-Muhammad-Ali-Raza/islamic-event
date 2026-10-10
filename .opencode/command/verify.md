---
description: Run the repo verify batch: typecheck both apps, lint web, run API tests
---

Run the standard verify batch for this repo (from the repo root), stopping at the first failure and reporting each step's exit code:

1. `npx tsc --noEmit -p apps/api`
2. `npx tsc --noEmit -p apps/web`
3. `npm run lint --workspace apps/web`
4. `npm run test --workspace apps/api` (expect all suites green)
5. `npx vitest run` in `apps/web`

Do NOT run `npm run build` or restart dev servers — this command is code-level verification only. Report a concise pass/fail table at the end.
