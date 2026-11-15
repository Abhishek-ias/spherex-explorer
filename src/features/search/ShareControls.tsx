import { useRef, useState, type ChangeEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CloudUpload, Copy, Download, FolderOpen, Share2 } from 'lucide-react'
import { useCreateInvestigationShare } from '@/api/hooks/useServerShare'
import type { InvestigationShareRequest } from '@/api/v21ShareTypes'
import {
  createInvestigationBackup,
  restoreInvestigationBackup,
} from './investigationBackup'

type Props = {
  serverSharePayload?: InvestigationShareRequest
  serverSharingEnabled?: boolean
  serverRestoreMessage?: string
}

export default function ShareControls({
  serverSharePayload,
  serverSharingEnabled = false,
  serverRestoreMessage,
}: Props) {
  const location = useLocation()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [message, setMessage] = useState('')
  const [serverShareUrl, setServerShareUrl] = useState('')
  const serverShare = useCreateInvestigationShare()

  const shareUrl = `${window.location.origin}${location.pathname}${location.search}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setMessage('Investigation link copied')
    } catch {
      setMessage('Clipboard unavailable. Copy the address from your browser.')
    }
  }

  function saveToBackend() {
    if (!serverSharePayload || !serverSharingEnabled) return

    serverShare.mutate(serverSharePayload, {
      onSuccess: (result) => {
        const rawQuery = result.share_query_string.trim()
        const query = rawQuery.startsWith('?')
          ? rawQuery
          : `?${rawQuery.replace(/^\\?/, '')}`
        const url = `${window.location.origin}/explore${query}`
        setServerShareUrl(url)
        setMessage(`Backend investigation saved · ID ${result.share_id}`)
      },
      onError: (error) => setMessage(error.message),
    })
  }

  async function copyServerShareLink() {
    if (!serverShareUrl) return
    try {
      await navigator.clipboard.writeText(serverShareUrl)
      setMessage('Backend-saved investigation link copied')
    } catch {
      setMessage('Clipboard unavailable. Copy the server share link shown below.')
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
        onClick={saveToBackend}
        disabled={!serverSharingEnabled || !serverSharePayload || serverShare.isPending}
        title={
          serverSharingEnabled
            ? 'Save this investigation through the backend v2.1 share API'
            : 'Configure the live backend v2.1 API to enable server-persisted shares'
        }
        className="inline-flex items-center gap-2 rounded-lg border border-observatory-border px-4 py-2 text-sm hover:border-observatory-cyan disabled:cursor-not-allowed disabled:opacity-40"
      >
        <CloudUpload size={15} />
        {serverShare.isPending ? 'Saving to backend…' : 'Save server share'}
      </button>
      {serverShareUrl && (
        <div className="basis-full rounded-lg border border-observatory-border p-3 text-xs">
          <p className="text-observatory-muted">Backend-persisted investigation link</p>
          <p className="mt-1 break-all font-mono">{serverShareUrl}</p>
          <button type="button" onClick={() => void copyServerShareLink()} className="mt-2 underline">
            Copy server share link
          </button>
        </div>
      )}
      {!serverSharingEnabled && (
        <p className="basis-full text-[11px] text-observatory-muted">
          Server-persisted sharing requires VITE_USE_MOCKS=false and VITE_API_BASE_URL pointing to the live v2.1 backend.
        </p>
      )}
      {serverRestoreMessage && (
        <p role="status" className="basis-full text-xs text-observatory-muted">
          {serverRestoreMessage}
        </p>
      )}
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
