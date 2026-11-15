# Backend handoff fixtures and integration notes

## Verified inputs supplied by the backend teammate

- All five target catalogue records from `GET /api/targets`.
- One complete 15-arcmin SPHEREx DR1 `POST /api/search` response for WISE 0855-0714, containing two comparable observation frames.
- One example each for source identification, Gaia/WISE overlays, difference imaging, and two-epoch object isolation.
- Generic job lifecycle examples for queued, running, completed and failed.
- A backend-side FastAPI/TestClient script to export all five live search JSON fixtures from IRSA.

## Mock data now wired into the frontend

- `src/mocks/fixtures/presetTargets.ts`: all five exact target records.
- `src/mocks/fixtures/wise0855Search.ts`: exact supplied WISE 0855 two-frame response.
- `src/mocks/fixtures/wise0855Responses.ts`: identify, overlay, difference and isolate example responses, typed only against generated OpenAPI v2.0 fields.
- `src/mocks/handlers.ts`: search, identify, overlay, difference, isolation, and asynchronous job handlers for the supported WISE sample. Unsupported targets return an explicit fixture-pending error. Generic unrepresented coordinates return the existing honest empty DEMO DATA response.
- `src/api/resolveApiAssetUrl.ts`: resolves backend-relative preview/cache URLs to the configured asset origin.
- `src/features/search/BackendImage.tsx`: reusable image load fallback with retry for difference and isolation panels.

## Explicit limitations

Only WISE 0855 has a full supplied observation search response. Do not use its IDs, timestamps, FITS links, positions or values to fabricate observations for Barnard's Star, Epsilon Indi, RW Aurigae or R Draconis. Those exports must come from the teammate's backend script running against the real backend and IRSA.

The supplied spectrum response is only a selected excerpt of the 102-channel array and the supplied WISE search has one epoch group. It is not sufficient to create a full spectral comparison mock. The mock endpoint therefore returns a clear 503 explaining that the complete fixture is not available.

The teammate describes a live backend v2.1.0, but the exact v2.1.0 OpenAPI export was not included. The frontend still generates types from repository `openapi.json` v2.0.0. New fields such as `significance_png_url`, additional coverage metadata and source cross-match properties must wait for that actual OpenAPI export. Do not hand-edit generated types to match examples.

Tracking, light-curve extraction, investigation persistence, source lookup and server-side job cancellation are proposals awaiting backend sign-off and contract publication. They are not current routes.

## Local integration configurations

Mocked JSON with real backend-served preview/cache assets:

```env
VITE_USE_MOCKS=true
VITE_API_BASE_URL=
VITE_ASSET_BASE_URL=https://your-backend-or-cloudflare-tunnel
```

Live backend for all API requests and assets:

```env
VITE_USE_MOCKS=false
VITE_API_BASE_URL=http://localhost:8000
VITE_ASSET_BASE_URL=
```

Use the tunnel URL in place of localhost when the backend runs on another machine. Do not commit `.env.development`.
