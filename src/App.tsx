import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link, Route, Routes, useParams } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'
import HomePage from '@/features/search/HomePage'
import ExploreWorkspace from '@/features/search/ExploreWorkspace'

class PageErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Page rendering error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="rounded-xl border border-observatory-border bg-observatory-surface p-8">
          <h2 className="text-xl font-semibold">This page encountered an error</h2>
          <p className="mt-2 text-observatory-muted">
            Try navigating to another section.
          </p>
        </section>
      )
    }

    return this.props.children
  }
}

function AboutPage() {
  return (
    <section className="max-w-4xl space-y-8">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-observatory-cyan">
          Project information
        </p>
        <h1 className="mt-3 font-heading text-3xl font-semibold">
          About SPHEREx Explorer
        </h1>
        <p className="mt-4 max-w-3xl leading-7 text-observatory-muted">
          An interface for exploring infrared sky observations, comparing
          epochs, inspecting spectra, and examining potential detections.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-xl border border-observatory-border bg-observatory-surface p-5">
          <h2 className="font-semibold">Data sources</h2>
          <p className="mt-3 text-sm leading-6 text-observatory-muted">
            The backend contract connects SPHEREx archive observations,
            ESA Gaia DR3, NASA AllWISE, and CSA NEOSSat records.
          </p>
        </article>
        <article className="rounded-xl border border-observatory-border bg-observatory-surface p-5">
          <h2 className="font-semibold">How it works</h2>
          <p className="mt-3 text-sm leading-6 text-observatory-muted">
            Coordinate searches and scientific processing are performed
            through the application backend. The browser displays returned
            images, measurements, and catalogue positions.
          </p>
        </article>
      </div>

      <div className="rounded-xl border border-observatory-border bg-observatory-surface p-5">
        <h2 className="font-semibold">Scientific limitations</h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-observatory-muted">
          <li>Observation coverage depends on the requested coordinates and field of view.</li>
          <li>Only backend-approved comparable frames should be used for epoch comparison.</li>
          <li>Missing spectral channels remain missing; the interface does not interpolate them.</li>
          <li>Catalogue matches are not guaranteed for every source.</li>
          <li>Potential detections are candidates for investigation, not confirmed discoveries.</li>
          <li>The current API does not provide tracking, light-curve, or saved-investigation endpoints.</li>
          <li>The spectrum response does not currently specify a flux_unit field.</li>
        </ul>
      </div>
    </section>
  )
}

function InvestigationRestorePage() {
  const { investigationId } = useParams()

  return (
    <section className="max-w-2xl rounded-xl border border-observatory-border bg-observatory-surface p-7">
      <p className="font-mono text-xs uppercase tracking-widest text-observatory-cyan">
        Saved investigation
      </p>
      <h1 className="mt-3 font-heading text-2xl font-semibold">
        Investigation restoration unavailable
      </h1>
      <p className="mt-3 text-sm leading-6 text-observatory-muted">
        Requested ID: <span className="font-mono">{investigationId}</span>.
        The current backend contract does not include an investigation
        retrieval endpoint. Search links containing coordinate and viewer
        parameters can still be restored directly.
      </p>
      <Link to="/" className="mt-5 inline-block text-sm text-observatory-cyan underline">
        Return to Home
      </Link>
    </section>
  )
}
function NotFoundPage() {
  return (
    <section className="py-16 text-center">
      <p className="font-mono text-sm text-observatory-cyan">404</p>
      <h1 className="mt-3 font-heading text-3xl font-semibold">Page not found</h1>
      <Link to="/" className="mt-6 inline-block text-observatory-cyan underline">
        Return home
      </Link>
    </section>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<PageErrorBoundary><AppLayout /></PageErrorBoundary>}>
        <Route index element={<PageErrorBoundary><HomePage /></PageErrorBoundary>} />
        <Route path="explore" element={<PageErrorBoundary><ExploreWorkspace /></PageErrorBoundary>} />
        <Route path="about" element={<PageErrorBoundary><AboutPage /></PageErrorBoundary>} />
        <Route path="d/:investigationId" element={<PageErrorBoundary><InvestigationRestorePage /></PageErrorBoundary>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}