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
VITE_USE_MOCKS=true
VITE_API_BASE_URL=
VITE_ASSET_BASE_URL=
```

Keep `VITE_USE_MOCKS=true` while the backend is unavailable. MSW intercepts API JSON on the frontend origin. Current mock data contains all five backend-provided preset target records and one verified two-frame WISE 0855 response. Full 250-observation files for all five targets are referenced in the handoff ZIP; that ZIP is not included in the currently mounted uploads, so use the live backend for complete observation timelines. Do not commit `.env.development`.

### Run against the live backend (recommended for the five NASA targets)

Start the backend on the same machine, then use:

```env
VITE_USE_MOCKS=false
VITE_API_BASE_URL=http://127.0.0.1:8000
VITE_ASSET_BASE_URL=
```

The backend handoff confirms `GET /api/targets` and `POST /api/search` return the five benchmark targets with 250 Level-2 observation records and multi-epoch coverage. The live backend is the source for those full observation timelines; do not mistake the limited MSW fixtures for the complete NASA sample archive.

For a backend running on another computer, replace `127.0.0.1` with its LAN IP and ensure FastAPI is reachable from the frontend machine. The handoff confirms CORS is enabled. Preview and generated `/api/cache/*.png` URLs are resolved against `VITE_API_BASE_URL`.

To keep mocked JSON while loading genuine preview/cache PNGs from a backend host or Cloudflare tunnel, leave mocks enabled and set `VITE_ASSET_BASE_URL` to that backend origin.

## Quality checks

```powershell
npm run typecheck
npm run lint
npm run test
npm run build
```

## Browser end-to-end tests

Install the browser engines used by the Playwright project matrix:

```powershell
npx playwright install chromium firefox webkit
npm run test:e2e
```

The Playwright suite runs against the Vite development server with MSW enabled. It covers coordinate validation, FOV options, search URL parameters, navigation, guided-tour controls, skip navigation, keyboard form use, responsive overflow at 320/375/768/1024/1366/1920 px, and reduced-motion preferences. A separate axe-core scan checks the homepage, About page and empty Explorer page against WCAG 2.1/2.2 A and AA rules. The axe script is loaded from a pinned CDN URL during that audit, so the test runner needs outbound network access to cdnjs.

CI runs TypeScript, ESLint, Vitest, Playwright across Chromium/Firefox/WebKit, the axe-core audit, and the production build on pull requests to `main`.

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
