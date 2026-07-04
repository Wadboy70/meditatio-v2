# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Project docs

- Read `ARCHITECTURE.md` before making structural changes.
- After major changes (new routes, folders, integrations, or conventions), update `ARCHITECTURE.md` in the same session.

## Frontend UI

- Before building UI, read `.cursor/rules/frontend.mdc` and audit `@/components` (`components/index.ts`).
- Import shared components from `@/components` when possible; do not duplicate patterns inline in screens.
