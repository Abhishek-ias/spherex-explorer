import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Copy, Share2 } from 'lucide-react'

export default function ShareControls() {
  const location = useLocation()
  const [message, setMessage] = useState('')

  const shareUrl =
    `${window.location.origin}${location.pathname}${location.search}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setMessage('Link copied')
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
      } catch {
        setMessage('Sharing cancelled or unavailable.')
      }
    } else {
      await copyLink()
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => void copyLink()}
        className="inline-flex items-center gap-2 rounded-lg border border-observatory-border px-4 py-2 text-sm hover:border-observatory-cyan"
      >
        <Copy size={15} /> Copy investigation link
      </button>
      <button
        onClick={() => void shareLink()}
        className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
      >
        <Share2 size={15} /> Share
      </button>
      {message && (
        <span role="status" className="text-xs text-observatory-muted">
          {message}
        </span>
      )}
    </div>
  )
}