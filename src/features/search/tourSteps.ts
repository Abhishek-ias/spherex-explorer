export const guidedTourSteps = [
  {
    title: 'Search a position',
    description: 'Enter ICRS right ascension and declination in decimal degrees or sexagesimal notation, then choose a field of view.',
  },
  {
    title: 'Explore observations',
    description: 'Open a returned observation, inspect its metadata, and move through available frames using the timeline.',
  },
  {
    title: 'Investigate the signal',
    description: 'When the backend supplies the required frames, compare spectra, inspect catalogue overlays, and review potential detections.',
  },
  {
    title: 'Share your view',
    description: 'Copy or share the current URL. Coordinate, frame, comparison, layer, and opacity settings are included when available.',
  },
] as const
