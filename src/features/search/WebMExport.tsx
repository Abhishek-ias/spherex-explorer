import { useState } from 'react'
import { Download, Film } from 'lucide-react'
import { chooseWebmMimeType, fitImageToCanvas } from './webmExportUtils'

export type WebMFrame = {
  obsId: string
  dateIso: string
  imageUrl: string
}

type Props = { frames: WebMFrame[] }

function loadPreviewImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(
      'A preview image could not be loaded. The backend preview host must permit cross-origin canvas access.',
    ))
    image.src = url
  })
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds))
}

export default function WebMExport({ frames }: Props) {
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')

  async function exportSequence() {
    if (frames.length < 2 || exporting) return

    if (
      typeof MediaRecorder === 'undefined' ||
      typeof HTMLCanvasElement.prototype.captureStream !== 'function'
    ) {
      setMessage('WebM recording is not supported in this browser.')
      return
    }

    const mimeType = chooseWebmMimeType((candidate) =>
      MediaRecorder.isTypeSupported(candidate),
    )
    if (!mimeType) {
      setMessage('This browser does not provide a WebM video encoder.')
      return
    }

    setExporting(true)
    setProgress(0)
    setMessage('Preparing the observation sequence…')

    let stream: MediaStream | null = null
    let recorder: MediaRecorder | null = null

    try {
      const firstImage = await loadPreviewImage(frames[0].imageUrl)
      const maxDimension = 1280
      const resizeFactor = Math.min(
        1,
        maxDimension / Math.max(firstImage.naturalWidth, firstImage.naturalHeight),
      )
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(firstImage.naturalWidth * resizeFactor))
      canvas.height = Math.max(1, Math.round(firstImage.naturalHeight * resizeFactor))

      const context = canvas.getContext('2d')
      if (!context) throw new Error('A 2D canvas context is unavailable.')

      stream = canvas.captureStream(2)
      recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2_000_000,
      })

      const chunks: Blob[] = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data)
      }

      const stopped = new Promise<void>((resolve, reject) => {
        if (!recorder) {
          reject(new Error('Video recorder was not initialized.'))
          return
        }
        recorder.onstop = () => resolve()
        recorder.onerror = () => reject(new Error('The browser failed while recording the WebM video.'))
      })

      recorder.start(250)

      for (let index = 0; index < frames.length; index += 1) {
        const image = index === 0
          ? firstImage
          : await loadPreviewImage(frames[index].imageUrl)

        context.fillStyle = '#03060d'
        context.fillRect(0, 0, canvas.width, canvas.height)

        const fit = fitImageToCanvas(
          image.naturalWidth,
          image.naturalHeight,
          canvas.width,
          canvas.height,
        )
        if (fit) context.drawImage(image, fit.x, fit.y, fit.width, fit.height)

        const label = `${index + 1}/${frames.length} · ${frames[index].obsId} · ${frames[index].dateIso}`
        const fontSize = Math.max(12, Math.round(canvas.width / 75))
        const labelHeight = fontSize * 1.8
        context.font = `${fontSize}px monospace`
        context.fillStyle = 'rgba(0, 0, 0, 0.72)'
        context.fillRect(0, canvas.height - labelHeight, canvas.width, labelHeight)
        context.fillStyle = '#ffffff'
        context.textBaseline = 'middle'
        context.fillText(label, fontSize, canvas.height - labelHeight / 2)

        setProgress(index + 1)
        setMessage(`Rendering frame ${index + 1} of ${frames.length}…`)
        await wait(850)
      }

      recorder.stop()
      await stopped

      const blob = new Blob(chunks, { type: recorder.mimeType || mimeType })
      if (blob.size === 0) throw new Error('The browser produced an empty WebM file.')

      const downloadUrl = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = downloadUrl
      anchor.download = 'spherex-observation-sequence.webm'
      anchor.click()
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 30_000)
      setMessage(`WebM export ready · ${frames.length} frames`)
    } catch (reason) {
      if (recorder?.state === 'recording') recorder.stop()
      const detail = reason instanceof Error ? reason.message : 'The WebM export failed.'
      setMessage(`WebM export failed: ${detail}`)
    } finally {
      stream?.getTracks().forEach((track) => track.stop())
      setExporting(false)
    }
  }

  return (
    <section className="rounded-xl border border-observatory-border bg-observatory-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <Film size={19} className="mt-0.5 text-observatory-cyan" />
          <div>
            <h2 className="font-semibold">Export observation sequence</h2>
            <p className="mt-1 text-xs leading-5 text-observatory-muted">
              Create a WebM preview from backend-returned observation images.
              Each frame is labelled with its observation ID and timestamp.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void exportSequence()}
          disabled={frames.length < 2 || exporting}
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Download size={15} />
          {exporting ? 'Rendering…' : 'Export WebM'}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-observatory-muted">
        <span>{frames.length} available observation frames</span>
        {exporting && <span>{progress} / {frames.length} rendered</span>}
      </div>

      {exporting && (
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-observatory-border"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={frames.length}
          aria-valuenow={progress}
          aria-label="WebM export progress"
        >
          <div
            className="h-full rounded-full bg-observatory-cyan transition-all"
            style={{ width: `${frames.length ? (progress / frames.length) * 100 : 0}%` }}
          />
        </div>
      )}

      {message && (
        <p role="status" aria-live="polite" className="mt-3 text-xs text-observatory-muted">
          {message}
        </p>
      )}

      {frames.length < 2 && (
        <p className="mt-2 text-xs text-observatory-muted">
          At least two backend-returned observation frames are required.
        </p>
      )}

      <p className="mt-2 text-[11px] leading-5 text-observatory-muted">
        Export uses browser MediaRecorder and canvas capture. Preview image hosts must permit
        cross-origin canvas access; this export generates no new scientific measurements.
      </p>
    </section>
  )
}
