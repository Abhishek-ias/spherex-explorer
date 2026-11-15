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
| 0 | Setup and contract | React 18, strict TypeScript, Vite, Tailwind theme, routing, TanStack Query, OpenAPI type generation, MSW, Vitest, CI | Zustand store now manages shareable frame, comparison, timeline-band, layer visibility, opacity and selected catalogue-source UI state; deployment pipeline remains to be completed |
| 1 | Home and search | Landing page, reduced-motion-aware starfield, guided tour, decimal/sexagesimal parsing, RA/Dec validation, FOV selector, filtering of backend-returned preset targets, shareable coordinate URL, invalid-link feedback | Actual five-target catalogue data requires backend `GET /api/targets` records; current MSW target fixture intentionally returns an empty list |
| 2 | Viewer, timeline and metadata | Canvas viewer, pan/zoom/reset/double-click zoom, image-aware click mapping, target/object/catalogue markers, timeline playback, stepping, speed, wavelength-band filtering with URL persistence, epoch markers, metadata, blink and curtain comparison modes | Compass orientation, WCS coordinate readout and scale bar need backend WCS/orientation/pixel-scale fields; no such fields are present in the current observation-frame schema |
| 3 | Object selection | Backend identification hook, cancellation of outdated requests, pending marker, identified-source marker, object measurements/status and action links | The current identify response does not provide a Gaia/SIMBAD/known-object match badge; it must not be inferred |
| 4 | Spectral analysis | Earlier/later spectra, error bars, difference spectrum, CSV export, missing-channel gaps, measured-channel coverage, wavelength coverage, raw non-zero quality-flag table and highlighted non-zero-flag plot points | The schema has no `flux_unit` and no quality-flag code legend; display returned flags verbatim and do not invent semantics |
| 5 | Catalogue overlays | Combined Gaia/WISE overlay hook, layer toggles, opacity sliders, URL-persisted layer settings, marker hit testing, source detail popups/lists, keyboard toggles, opt-in Aladin Lite v3 context map with ESA DSS Color HiPS mirror and external-viewer fallback | External map tile availability depends on the upstream provider; a complete cross-browser and accessibility audit remains |
| 6 | Difference imaging | Synchronous difference endpoint, optional background job submission and progress polling, direct-endpoint fallback, schema validation of completed job result, earlier/later/difference synchronized views, shared zoom/pan, blink/curtain modes, potential-detection cards and candidate focus on the difference image | Current response has no colour-scale limits, colormap name or significance-map URL; the generic job result is validated at runtime against the generated DifferenceResponse structure before display. Stop monitoring stops client polling only; there is no server-side job-cancel endpoint |
| 7 | Tracking and isolation | Backend two-epoch source isolation, two-frame sequence play/pause/step/speed controls, backend-reported source measurements, optional object_isolate background-job submission/progress polling/result validation and direct-endpoint fallback | Fixed-sky/follow-object tracking and light curves need dedicated backend endpoints, which are not in the current OpenAPI contract |
| 8 | Sharing and delivery | URL sharing for coordinate, frame, compare, band, layer, opacity and selected object ID state; versioned local JSON backup/restore of validated shareable URL state; About/limitations page; guided tour; keyboard-shortcut help; Gaia/WISE shortcuts; panel error boundaries; responsive checks; Vitest and Playwright across Chromium, Firefox and WebKit; browser-based WebM export from returned preview images | Backend investigation persistence and full selected-object restoration need save/restore and source-lookup endpoints; local backup does not store FITS data or measurements. GIF export, full axe accessibility audit, mobile/tablet checks across every browser engine, final responsive audit and deployment remain |

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

The current contract does **not** include tracking, light-curve, investigation save/restore, source lookup by object ID, or job cancellation routes. Both supported long-running frontend workflows (`difference_image` and `object_isolate`) submit through the generic jobs endpoint and validate completed payloads against their OpenAPI response structures. It also does not specify a spectrum `flux_unit`, quality-flag legend, WCS coordinate transform, pixel scale, image orientation, difference-image colour scale, or significance-map resource. These are backend-contract requests, not frontend assumptions.

## Test commands

```powershell
npm run typecheck
npm run lint
npm run test
npm run test:e2e
npm run build
```

CI runs the same checks plus Playwright Chromium installation on pull requests to `main`. The latest verified job for the local investigation backup and cross-browser test update passed TypeScript, ESLint, unit tests, Playwright browser tests in Chromium, Firefox and WebKit, and the production build. Responsive assertions currently cover the homepage at 375 px and 768 px viewports.
