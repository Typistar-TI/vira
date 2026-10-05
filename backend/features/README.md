# Feature layers

Each feature owns four directories:

- `controller/`: HTTP or scheduled entrypoints; authentication, request parsing and responses.
- `service/`: business rules, orchestration and external integrations.
- `repository/`: database reads/writes and persistence adapters.
- `entities/`: domain types and schemas.

`routes.ts` composes controllers. Shared runtime infrastructure stays in `backend/platform/`; SQL migrations stay in `backend/migrations/`. Do not import frontend pages or components from backend features.

New queries belong in repositories. Keep migrations backward-compatible and run the authentication tests after changing auth controllers, services or repositories.
