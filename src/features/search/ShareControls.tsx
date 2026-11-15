import { useRef, useState, type ChangeEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Copy, Download, FolderOpen, Share2 } from 'lucide-react'
import {
  createInvestigationBackup,
  restoreInvestigationBackup,
} from './investigationBackup'

export default function ShareControls() {
  const location = useLocation()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')

  const shareUrl = `${window.location.origin}${location.pathname}${location.search}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setMessage('Investigation link copied')
    } catch {
      setMessage('Clipboard unavailable. Copy the address from your browser.')
    }
  }

  async function shareLink() {
    const shareNavigator = navigator as Navigator & {
      share?: (data: ShareData) => Promise<void>
    }
    if (shareNavigator.share) {
      try {
        await shareNavigator.share({
          title: 'SPHEREx Explorer investigation',
          text: 'Explore this SPHEREx sky position.',
          url: shareUrl,
        })
        setMessage('Share sheet opened')
      } catch {
        setMessage('Sharing cancelled or unavailable.')
      }
    } else {
      await copyLink()
    }
  }

  function saveBackup() {
    const backup = createInvestigationBackup(location.pathname, location.search)
    if (!backup) {
      setMessage('Open a valid explorer search before saving an investigation file.')
      return
    }
    const blob = new Blob([backup], { type: 'application/json' })
    const objectUrl = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = objectUrl
    anchor.download = `spherex-investigation-${new Date().toISOString().slice(0, 10)}.json`
    anchor.click()
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
    setMessage('Local investigation backup downloaded')
  }

  async function loadBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    try {
      if (file.size > 64 * 1024) {
        setMessage('Backup file is too large. Select a file smaller than 64 KB.')
        return
      }
      const raw: unknown = JSON.parse(await file.text())
      const search = restoreInvestigationBackup(raw)
      if (search === null) {
        setMessage('This file is not a valid SPHEREx investigation backup.')
        return
      }
      setMessage('Investigation backup validated and restored')
      navigate({ pathname: '/explore', search: `?${search}` })
    } catch {
      setMessage('Could not read this JSON backup file.')
    } finally {
      event.target.value = ''
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={() => void copyLink()}
        className="inline-flex items-center gap-2 rounded-lg border border-observatory-border px-4 py-2 text-sm hover:border-observatory-cyan"
      >
        <Copy size={15} /> Copy investigation link
      </button>
      <button
        type="button"
        onClick={() => void shareLink()}
        className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
      >
        <Share2 size={15} /> Share
      </button>
      <button
        type="button"
        onClick={saveBackup}
        className="inline-flex items-center gap-2 rounded-lg border border-observatory-border px-4 py-2 text-sm hover:border-observatory-cyan"
      >
        <Download size={15} /> Save backup
      </button>
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="inline-flex items-center gap-2 rounded-lg border border-observatory-border px-4 py-2 text-sm hover:border-observatory-cyan"
      >
        <FolderOpen size={15} /> Restore backup
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        aria-label="Choose SPHEREx investigation backup"
        className="sr-only"
        onChange={(event) => void loadBackup(event)}
      />
      {message && (
        <span role="status" aria-live="polite" className="basis-full text-xs text-observatory-muted">
          {message}
        </span>
      )}
      <p className="basis-full text-[11px] leading-5 text-observatory-muted">
        Backup files store the current shareable URL state locally. Restoring a selected object
        requires a backend source-lookup endpoint; this file does not store FITS data or measurements.
      </p>
    </div>
  )
}
