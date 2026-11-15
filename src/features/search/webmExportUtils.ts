const WEBM_MIME_CANDIDATES = [
  'video/webm;codecs=vp9',
  'video/webm;codecs=vp8',
  'video/webm',
] as const

export function chooseWebmMimeType(
  isSupported: (mimeType: string) => boolean,
): string | null {
  return WEBM_MIME_CANDIDATES.find(isSupported) ?? null
}

export function fitImageToCanvas(
  imageWidth: number,
  imageHeight: number,
  canvasWidth: number,
  canvasHeight: number,
): { x: number; y: number; width: number; height: number } | null {
  if (imageWidth <= 0 || imageHeight <= 0 || canvasWidth <= 0 || canvasHeight <= 0) {
    return null
  }

  const scale = Math.min(canvasWidth / imageWidth, canvasHeight / imageHeight)
  const width = imageWidth * scale
  const height = imageHeight * scale

  return { x: (canvasWidth - width) / 2, y: (canvasHeight - height) / 2, width, height }
}
