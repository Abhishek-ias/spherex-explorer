# SPHEREx Explorer — Frontend Roadmap Tracker

This file tracks implementation against the original **SPHEREx Explorer: Frontend Roadmap** (19 pages) and its companion **Phase-by-Phase Frontend Build Guide**. Those supplied documents remain the complete acceptance-criteria source; this tracker records implementation status and known contract constraints.

## Non-negotiable project rules

- The frontend uses the FastAPI backend through `src/api`; it does not call NASA or IRSA archives directly.
- API types come from generated `src/api/schema.d.ts`, based on the checked-in `openapi.json`.
- Never invent endpoints, schema fields, scientific measurements, units, WCS, or quality-flag meanings.
- Missing channels and nullable values remain missing; do not interpolate or fabricate them.
- Mock responses are labelled **DEMO DATA**. Potential detections are not called discoveries.
- Compare only frames the backend marks in `comparable_with`.

## Phase status

| Phase | Scope | Implemented in the frontend | Remaining / blocked |
|---|---|---|---|
| 0 | Setup and contract | React 18, strict TypeScript, Vite, Tailwind theme, routing, TanStack Query, OpenAPI type generation, MSW, Vitest, CI | Zustand stores are installed but not yet used across viewer/selection/layer state; deployment pipeline remains to be completed |
| 1 | Home and search | Landing page, animated starfield (reduced-motion aware), guided tour, decimal/sexagesimal parsing, RA/Dec validation, FOV selector, preset-target filtering, shareable coordinate URL, invalid-link feedback | Real preset targets require backend `GET /api/targets` records; mocks intentionally return an empty list |
| 2 | Viewer, timeline and metadata | Canvas viewer, pan/zoom/reset/double-click zoom, image-aware click mapping, target/candidate/overlay markers, timeline playback, stepping, speed, wavelength-band filter (URL-persisted), epoch markers, metadata | Compass orientation, WCS readout and scale bar need backend WCS/orientation/pixel-scale fields; no such fields are present in the current frame schema |
| 3 | Object selection | Backend identification hook, cancellation of outdated requests, pending marker, identified-source marker, object measurements/status and action links | The current identify response does not provide a catalogue-match badge; it must not be inferred |
| 4 | Spectral analysis | Earlier/later spectra, error bars, difference spectrum, CSV export, missing-channel gaps, measured-channel coverage, wavelength coverage, raw non-zero quality-flag table | The schema has no `flux_unit` and no quality-flag code legend; display returned flags verbatim and do not invent semantics |
| 5 | Catalogue overlays | Combined Gaia/WISE overlay hook, layer toggles, opacity sliders, URL-persisted layer settings, marker hit testing, source detail popups and source lists | Optional Aladin Lite v3 context map with an ESA DSS Color HiPS mirror and external-viewer fallback; provider tile availability remains external |
| 6 | Difference imaging | Backend difference endpoint, earlier/later/difference synchronized views, shared zoom/pan, potential-detection cards and candidate focus | Current response has no colour-scale limits, colormap name, significance-map URL or async-job result schema; those controls require backend contract fields |
| 7 | Tracking and isolation | Backend two-epoch source isolation, sequence play/pause/step/speed controls, side-by-side epoch measurements | Fixed-sky/follow-object tracking and light curves need dedicated backend endpoints, which are not in the current OpenAPI contract |
| 8 | Sharing and delivery | URL sharing, frame/compare/layer/opacity state, About/limitations page, guided tour, keyboard help, shortcuts, responsive layout work, Vitest and Playwright browser checks | Investigation save/restore needs API endpoints; WebM export is implemented using browser capture of backend preview images; GIF export, full accessibility audit, wider cross-browser testing, final responsive audit and deployment remain |

## Current API blockers

The supplied OpenAPI contract includes:

- `GET /api/targets`
- `POST /api/search`
- `POST /api/objects/identify`
- `POST /api/spectra/compare`
- `POST /api/overlays`
- `POST /api/images/difference`
- `POST /api/objects/isolate`
- `POST /api/jobs` and `GET /api/jobs/{id}`

The current contract does **not** include tracking, light-curve, or investigation save/restore routes. It also does not specify a spectrum `flux_unit`, quality-flag legend, WCS coordinate transform, pixel scale, image orientation, difference-image colour scale, or significance-map resource. These are backend-contract requests, not frontend assumptions.

## Test commands

```powershell
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
```

CI runs the same checks plus Playwright Chromium installation on pull requests to `main`.
