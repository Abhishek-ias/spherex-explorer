import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Link, Route, Routes, useParams } from 'react-router-dom'
import AppLayout from '@/components/layout/AppLayout'

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

function HomePage() {
  return (
    <section className="flex min-h-[65vh] flex-col justify-center">
      <p className="font-mono text-sm uppercase tracking-[0.25em] text-observatory-cyan">
        Infrared sky exploration
      </p>
      <h1 className="mt-5 max-w-3xl font-heading text-5xl font-semibold tracking-tight sm:text-6xl">
        Explore the SPHEREx universe.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-observatory-muted">
        Search the sky, inspect observation epochs, and investigate potential
        astronomical signals through one exploration workspace.
      </p>
      <div className="mt-9">
        <Link
          to="/explore"
          className="inline-flex rounded-lg bg-observatory-cyan px-6 py-3 font-semibold text-slate-950 transition hover:opacity-90"
        >
          Open Explorer
        </Link>
      </div>
    </section>
  )
}

function ExplorePage() {
  return (
    <section>
      <p className="font-mono text-xs uppercase tracking-widest text-observatory-cyan">
        Workspace
      </p>
      <h1 className="mt-3 font-heading text-3xl font-semibold">Sky Explorer</h1>
      <p className="mt-3 text-observatory-muted">
        Coordinate search and observation exploration will be implemented in Phase 1.
      </p>
    </section>
  )
}

function InvestigationPage() {
  const { investigationId } = useParams<{ investigationId: string }>()

  return (
    <section>
      <p className="font-mono text-xs uppercase tracking-widest text-observatory-cyan">
        Saved investigation
      </p>
      <h1 className="mt-3 font-heading text-3xl font-semibold">
        Investigation
      </h1>
      <p className="mt-3 text-observatory-muted">
        Investigation ID: <span className="font-mono">{investigationId}</span>
      </p>
      <p className="mt-2 text-sm text-observatory-muted">
        Restoring saved investigation data will be connected when the backend
        provides the required persistence endpoints.
      </p>
    </section>
  )
}

function AboutPage() {
  return (
    <section className="max-w-3xl">
      <p className="font-mono text-xs uppercase tracking-widest text-observatory-cyan">
        About the project
      </p>
      <h1 className="mt-3 font-heading text-3xl font-semibold">
        About SPHEREx Explorer
      </h1>
      <p className="mt-4 leading-7 text-observatory-muted">
        SPHEREx Explorer is an astronomical data exploration interface.
        It is designed to help users search sky coordinates, inspect
        observations, compare epochs, and investigate potential detections.
      </p>
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
      <Route
        element={
          <PageErrorBoundary>
            <AppLayout />
          </PageErrorBoundary>
        }
      >
        <Route index element={<PageErrorBoundary><HomePage /></PageErrorBoundary>} />
        <Route path="explore" element={<PageErrorBoundary><ExplorePage /></PageErrorBoundary>} />
        <Route path="d/:investigationId" element={<PageErrorBoundary><InvestigationPage /></PageErrorBoundary>} />
        <Route path="about" element={<PageErrorBoundary><AboutPage /></PageErrorBoundary>} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
