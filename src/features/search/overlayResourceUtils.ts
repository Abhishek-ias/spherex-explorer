export function getWiseImageLayerUrl(value: unknown): string | undefined {
  if (!value || typeof value !== 'object' || !('wise_image_png_url' in value)) return undefined
  const url = (value as { wise_image_png_url?: unknown }).wise_image_png_url
  return typeof url === 'string' && url.trim() ? url : undefined
}
