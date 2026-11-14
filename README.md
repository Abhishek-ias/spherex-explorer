# SPHEREx Explorer

A React and TypeScript frontend for exploring SPHEREx infrared sky observations, comparing epochs, inspecting spectra, and investigating potential detections.

The application uses a contract-first FastAPI backend. API types are generated from `openapi.json`; the browser does not call NASA or IRSA archives directly.

## Requirements

- Node.js 22
- npm 10 or newer
- The SPHEREx Explorer backend when testing real observations

## Local setup

```powershell
npm ci
Copy-Item .env.example .env.development
npm run dev
```

The development server prints the local URL. The mock flag is controlled by `VITE_USE_MOCKS`:

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_USE_MOCKS=true
```

Keep `VITE_USE_MOCKS=true` while the backend is unavailable. The current mock search/targets responses are intentionally empty and must not be mistaken for real survey data. Mock-backed screens show a `DEMO DATA` label. Do not commit `.env.development`.

When the backend is reachable, set `VITE_API_BASE_URL` to its base URL and set `VITE_USE_MOCKS=false`.

## Quality checks

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
```

## Browser end-to-end tests

Install the Chromium browser once:

```powershell
npx playwright install chromium
npm run test:e2e
```

The Playwright suite runs against the Vite development server with MSW enabled. It covers coordinate validation, FOV options, search URL parameters, the expected empty mock response, navigation, the guided tour, mobile/tablet overflow, and reduced-motion preferences.

CI runs typecheck, ESLint, Vitest, Playwright Chromium tests, and the production build on pull requests to `main`.

## API contract workflow

After the backend OpenAPI contract changes:

1. Update the root `openapi.json` from the backend team's published schema.
2. Regenerate TypeScript API types:

```powershell
npm run generate:api
```

3. Review the generated schema diff before updating API hooks or UI components.

Do not invent fields, endpoints, scientific measurements, quality-flag meanings, or flux units. Missing values stay missing. Potential detections are candidates for investigation, not confirmed discoveries.

## Roadmap tracking

See [docs/frontend-roadmap.md](docs/frontend-roadmap.md) for the implementation status, contract blockers, and remaining delivery work. The original 19-page *SPHEREx Explorer: Frontend Roadmap* and the phase-by-phase build guide remain the full acceptance-criteria sources.
