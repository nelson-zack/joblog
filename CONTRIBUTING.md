# Contributing

Thanks for helping improve JobLog! This repo keeps production data private, so please follow the guidelines below when opening PRs.

## Local setup

- **Frontend**: `cd frontend && npm ci && npm run dev`
- **Backend**: `cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt`
- Secrets live in `.env` / `.env.local` files which are gitignored. Copy the snippets in README to create local variants.

## Testing conventions

- Run `pytest` from `backend/` before pushing. Fixtures live in `backend/tests/conftest.py`; add new API tests under `backend/tests/` using the provided helpers in `factories.py`.
- Run `npm run test` from `frontend/`. Tests live in `frontend/src/__tests__/` and use Vitest + Testing Library. Import utilities via `@/` alias when convenient.
- Both suites stub analytics/network calls, so no external traffic should occur.
- Place coverage artifacts under `coverage/` (already ignored).

When adding new endpoints or components, include a focused test that exercises the behaviour. Keep tests deterministic—freeze time with `freezegun` (backend) or `vi.useFakeTimers()` (frontend) if needed.

Happy shipping! 🚀
