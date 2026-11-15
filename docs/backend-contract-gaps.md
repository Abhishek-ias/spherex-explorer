# SPHEREx Explorer — Backend Contract Gap List

This is a handoff checklist for the backend developer. It compares the checked-in `openapi.json` with the supplied frontend roadmap. Items below are absent or underspecified in the current contract. Proposed names and fields are requests for agreement, not existing API facts.

## Existing endpoints used by the frontend

| Operation | Purpose |
|---|---|
| `GET /api/targets` | Preset target records |
| `POST /api/search` | Coordinate/FOV observation search |
| `GET /api/preview` | Preview retrieval |
| `POST /api/objects/identify` | Click-pixel source identification |
| `POST /api/spectra/compare` | Compare spectra across epochs |
| `POST /api/overlays` | Combined Gaia DR3, AllWISE and NEOSSat context |
| `POST /api/images/difference` | Synchronous difference image and candidate response |
| `POST /api/images/stack` | Image stacking |
| `POST /api/objects/isolate` | Synchronous two-epoch source isolation |
| `POST /api/jobs`, `GET /api/jobs/{id}` | Generic job submission and progress/result polling |

The frontend follows these real contract paths, even where names differ from the original roadmap suggestions.

## Required fixtures for the five-target demo

Please provide cached, schema-valid responses for the five agreed sample targets:

1. A non-empty `GET /api/targets` response with five `PresetTarget` records.
2. A full `POST /api/search` response for each target, with observations grouped into their returned epochs.
3. Correct `comparable_with` lists for every observation frame that can validly be compared.
4. Representative identify, spectra, overlays, difference and isolation responses for at least one sample target using actual backend-derived results.
5. Example `queued`, `running`, `completed` and `failed` job statuses for `difference_image` and `object_isolate`. Completed job results should follow the same response shapes as their synchronous endpoints.

The current MSW target/search handlers intentionally return empty data. The frontend does not fabricate astronomical observations or measurements.

## Contract work needed for remaining roadmap requirements

| Requirement | Current contract gap | Backend decision requested |
|---|---|---|
| Compass, scale bar and cursor RA/Dec readout | No orientation, pixel scale or WCS transform fields in the frame/search responses | Return authoritative per-frame orientation, `pixel_scale_arcsec` and WCS/display metadata. Specify how image axes map to ICRS coordinates. |
| Spectrum flux unit | Spectrum/channel/raw-point models have no `flux_unit` | Add an explicit flux unit at the spectrum or measurement level. The UI must not guess it. |
| Quality-flag meanings | Raw points contain numeric `quality_flag`, but no code legend or severity mapping | Publish flag-code definitions and semantics. Until then, the UI displays numeric flags verbatim. |
| Difference-image visual scale | `DifferenceResponse` has image URL, shape, target pixel and candidates, but no `vmin`, `vmax` or colormap name | Return the applied scale and colormap so the UI can show a truthful legend. |
| Significance map | No significance-map resource URL or image metadata | Return a separate significance-map resource and its scale/units if this layer is supported. |
| Typed job payloads/results | `JobSubmitRequest.payload` and `JobStatusResponse.result` are generic objects | Define request payload and result schemas for each supported job type, especially `difference_image` and `object_isolate`. The frontend currently validates completed results against their synchronous response models. |
| Server-side job cancellation | `GET /api/jobs/{id}` supports polling, but no cancel operation exists | Add a documented cancellation operation if user cancellation should stop backend processing. Stopping frontend polling does not cancel the server job. |
| Fixed Sky / Follow Object tracking | No tracking endpoint or trajectory schema | Agree a tracking request/response containing actual observation dates, measured RA/Dec, predicted positions where available, displacement, rate, position angle and uncertainties when calculated. |
| Light curve | No flux-versus-time endpoint or response model | Agree an extraction route with time/MJD, flux, uncertainty, flux unit, detector and quality metadata. |
| Saved investigations | No investigation create/read routes | Agree save/restore operations for search region, FOV, frame pair, selected object, active panel and layer state, including expiry behavior. |
| Restore selected object | Identification is click-pixel based; no lookup by `object_id` | Add a source lookup/re-identification operation so shared URLs can restore a selected measured source. |
| Survey-pass markers | Epoch groups include epoch IDs, dates and detectors, but no explicit survey pass ID/label | Return a pass identifier/label if the UI should distinguish survey passes from epoch groups. |

## Conventions to confirm

- RA/Dec are ICRS decimal degrees.
- Pixels are 0-based, origin at top-left, y increasing downward.
- State explicitly whether preview images are north-up/east-left; the UI must not assume it.
- Time values are ISO 8601 UTC and MJD.
- Missing measurements use `null`, not zero or NaN.
- Overlay pixel positions are returned for each requested observation frame.
- Only frames in backend-provided `comparable_with` lists may be compared.
- Candidate language remains “Potential detections”, not confirmed discoveries.

## Integration checkpoint

When the contract and cached target fixtures are ready, update `openapi.json`, regenerate `src/api/schema.d.ts`, add matching MSW fixtures, and rerun TypeScript, lint, unit tests, Playwright and production build before connecting the staging backend.
