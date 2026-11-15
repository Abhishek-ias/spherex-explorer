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
| 1 | Home and search | Landing page, reduced-motion-aware starfield, guided tour, decimal/sexagesimal parsing, RA/Dec validation, FOV selector, filtering of backend-returned preset targets, shareable coordinate URL, invalid-link feedback | MSW now includes all five exact backend-provided target records. The live backend handoff confirms five targets with 250 Level-2 observations each and multi-epoch coverage. The full search fixture ZIP named in the PDF is not included in the mounted uploads; live API search is required for complete timelines |
| 2 | Viewer, timeline and metadata | Canvas viewer, pan/zoom/reset/double-click zoom, image-aware click mapping, target/object/catalogue markers, timeline playback, stepping, speed, wavelength-band filtering with URL persistence, epoch markers, metadata, blink and curtain comparison modes | Backend-relative preview URLs resolve against the configured asset origin; retryable image fallback is shared by sky, difference and isolation views. v2.1 pixel scale and orientation are displayed when returned; a WCS coordinate readout and drawn scale bar still need a pixel-to-sky transform |
| 3 | Object selection | Backend identification hook, cancellation of outdated requests, pending marker, identified-source marker, object measurements/status and action links | v2.1 Gaia cross-match status, source flags, point flux and position uncertainty are displayed when returned. No SIMBAD match is inferred |
| 4 | Spectral analysis | Earlier/later spectra, error bars, difference spectrum, CSV export, missing-channel gaps, measured-channel coverage, wavelength coverage, raw non-zero quality-flag table and highlighted non-zero-flag plot points | The supplied spectrum sample is only an excerpt and the verified search response currently has one epoch, so the mock spectrum flow explicitly reports fixture unavailable rather than fabricating 102 channels. The schema also lacks `flux_unit` and quality-flag code definitions |
| 5 | Catalogue overlays | Combined Gaia/WISE overlay hook, layer toggles, opacity sliders, URL-persisted layer settings, marker hit testing, source detail popups/lists, keyboard toggles, opt-in Aladin Lite v3 context map with ESA DSS Color HiPS mirror and external-viewer fallback | A backend-provided Gaia/WISE overlay sample, WISE raster, FOV coverage fraction and coverage warnings are supported. External map tile availability depends on the upstream provider; a complete cross-browser and accessibility audit remains |
| 6 | Difference imaging | Synchronous difference endpoint, optional background job submission and progress polling, direct-endpoint fallback, schema validation of completed job result, earlier/later/difference synchronized views, shared zoom/pan, blink/curtain modes, potential-detection cards and candidate focus on the difference image | A backend-provided WISE 0855 candidate/difference response is available in MSW; v2.1 wavelength compatibility, photometric scale, display range, scientific warning and significance-map metadata are rendered when returned;  the generic job result is validated at runtime against the generated DifferenceResponse structure before display. Stop monitoring stops client polling only; there is no server-side job-cancel endpoint |
| 7 | Tracking and isolation | Backend two-epoch source isolation, two-frame sequence play/pause/step/speed controls, backend-reported source measurements, optional object_isolate background-job submission/progress polling/result validation and direct-endpoint fallback | A backend-provided WISE 0855 two-epoch isolation sample is now available in MSW. Fixed-sky/follow-object tracking and light curves need dedicated backend endpoints, which are not in the current OpenAPI contract |
| 8 | Sharing and delivery | URL sharing for coordinate, frame, compare, band, layer, opacity and selected object ID state; versioned local JSON backup/restore of validated shareable URL state; retryable backend image fallback; backend API health indicator; About/limitations page; guided tour; keyboard-shortcut help; Gaia/WISE shortcuts; panel error boundaries; responsive checks; Vitest and Playwright across Chromium, Firefox and WebKit; browser-based WebM export from returned preview images | Backend v2.1 POST/GET investigation share routes are integrated for server save and restore of documented coordinates, FOV and catalogue visibility. Exact epoch-to-observation mapping and selected-object lookup still need a published state/source-lookup contract; local JSON backup remains available. GIF export, full axe accessibility audit, mobile/tablet checks across every browser engine, final responsive audit and deployment remain |

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


## Backend handoff integration status (2026-11-15)

- The five preset target records from the teammate's exact `GET /api/targets` response are included in `src/mocks/fixtures/presetTargets.ts`.
- The only full search observation JSON supplied was WISE 0855-0714 at a 15 arcmin FOV, with two real SPHEREx DR1 frames. It is included in `src/mocks/fixtures/wise0855Search.ts`.
- The WISE 0855 identification, Gaia/WISE overlay, difference-candidate and two-epoch isolation samples supplied by the teammate are included in `src/mocks/fixtures/wise0855Responses.ts`, limited to the fields in the current checked-in generated OpenAPI v2.0 contract.
- MSW supports the WISE 0855 identify, overlays, difference, isolation, and difference/isolation job lifecycle. It explicitly returns a fixture-pending error for searches of the other four targets until their search exports arrive.
- The spectral sample in the handoff is an excerpt, not a complete 102-channel response, and the WISE search response currently has only one epoch group. The mock spectrum endpoint intentionally reports that the complete fixture is unavailable.
- The backend handoff includes a script for the teammate to export `frontend_fixtures/targets.json` and one search JSON per target using FastAPI TestClient and the live IRSA export. Add the output files only after the teammate supplies them; do not derive fake observation IDs or timestamps.
- The handoff says the live backend is v2.1.0 and has extra fields such as significance image URL and overlay coverage metadata. The actual v2.1.0 OpenAPI document was not attached, so no generated type changes for those fields have been made.
- The optional `VITE_ASSET_BASE_URL` lets mocked JSON use same-origin MSW while preview/cache images are loaded from the backend or a Cloudflare tunnel. Set it only to a backend host accessible by the browser.


## v2.1 backend handoff update (2026-11-15)

The uploaded Backend-to-Frontend Handoff Guide (v2.1.0 / v2.2.0 spec) confirms the following:

- Five benchmark targets; each has 250 Level-2 FITS observation records and multiple survey epochs.
- v2.1 observation metadata: `pixel_scale_arcsec`, `orientation`, `flux_unit`, `survey_week`, `survey_pass`.
- Source metadata: `flux_ujy`, `flux_err_ujy`, `position_err_arcsec`, `flag_labels`, `gaia_crossmatch`.
- Overlay metadata: `fov_coverage_fraction`, `coverage_complete`, `coverage_warning`, and `wise_image_png_url`.
- Difference metadata: `significance_png_url`, wavelength compatibility, photometric scale factor, scientific warning and `display_scale`.
- The `POST /api/share` and `GET /api/share/{share_id}` routes are marked live in the handoff and have a dedicated v2.1 client.
- Multi-epoch tracking, light-curve extraction, source lookup and job cancellation are in the handoff's additional-endpoint sign-off section; the checked-in v2.0 OpenAPI file does not contain them. They are not called as live routes.

The handoff PDF lists `spherex_frontend_handoff.zip` containing v2.1 `openapi.json`, `health.json`, `targets.json` and five full search fixtures. That ZIP was not present in the mounted uploads for this development turn. The repository's checked-in generated OpenAPI file is still v2.0.0; v2.1 additions are read through runtime-validated extension readers and a separate typed share client. Replace the generated contract only when the actual v2.1 OpenAPI JSON from the ZIP or live backend is supplied.
