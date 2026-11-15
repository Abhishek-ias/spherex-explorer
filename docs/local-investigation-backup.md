# SPHEREx Explorer — Local investigation backup

# Local investigation backup format

The current frontend supports saving and restoring the URL-backed portion of an investigation as a versioned JSON file. This is a local browser file, not a backend-saved investigation.

It includes the explorer route and validated query state: coordinates, FOV, frame ID, comparable-frame ID, wavelength band, catalogue layer visibility, Gaia/WISE opacity and selected object ID.

It does not embed preview images, FITS files, catalogue records or measurements. Restoring a selected object requires the backend source-lookup operation that is absent from the current OpenAPI contract. The existing copy/share URL remains available as the lightweight alternative.

Imports are limited to 64 KB, require schema version 1 and the `/explore` route, validate coordinate/FOV/layer/opacity parameters, and discard unsupported query keys before navigation.

