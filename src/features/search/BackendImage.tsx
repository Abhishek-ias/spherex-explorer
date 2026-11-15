import { useState } from 'react'
import type { CSSProperties } from 'react'

type Props = {
  src: string
  alt: string
  className?: string
  style?: CSSProperties
  draggable?: boolean
}

export default function BackendImage({
  src,
  alt,
  className = '',
  style,
  draggable = false,
}: Props) {
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  if (failed) {
    return (
      <div
        role="status"
        aria-label={`${alt}: image unavailable`}
        className={`flex items-center justify-center gap-3 border border-dashed border-observatory-border bg-[#080f1c] p-4 text-center ${className}`}
        style={style}
      >
        <div className="max-w-sm">
          <p className="text-sm font-medium text-observatory-muted">
            Image preview unavailable
          </p>
          <p className="mt-1 text-xs text-observatory-muted">
            Check the backend image-resource URL or connection, then retry.
          </p>
          <button
            type="button"
            onClick={() => {
              setFailed(false)
              setAttempt((current) => current + 1)
            }}
            className="mt-3 rounded-md border border-observatory-border px-3 py-1.5 text-xs text-observatory-text hover:border-observatory-cyan"
          >
            Retry image
          </button>
        </div>
      </div>
    )
  }

  return (
    <img
      key={attempt}
      src={src}
      alt={alt}
      draggable={draggable}
      className={className}
      style={style}
      onError={() => setFailed(true)}
    />
  )
}
