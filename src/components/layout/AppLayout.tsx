import { NavLink, Outlet } from 'react-router-dom'
import { Orbit, Keyboard } from 'lucide-react'

const navigation = [
  { label: 'Home', path: '/', end: true },
  { label: 'Explorer', path: '/explore', end: false },
  { label: 'About', path: '/about', end: false },
]

export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-observatory-bg text-observatory-text">
      <a href="#main-content" className="sr-only z-[100] rounded-md bg-observatory-cyan px-4 py-3 font-semibold text-[#041018] focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to main content
      </a>
      <header className="border-b border-observatory-border bg-observatory-surface/80">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <NavLink to="/" aria-label="SPHEREx Explorer home" className="flex items-center gap-3 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-observatory-cyan">
            <Orbit aria-hidden="true" className="h-7 w-7 text-observatory-cyan" />
            <span className="font-heading text-lg font-semibold tracking-wide">
              SPHEREx Explorer
            </span>
          </NavLink>

          <div className="flex flex-wrap items-center justify-end gap-3 sm:gap-6">
            <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-3 sm:gap-6">
              {navigation.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.end}
                  className={({ isActive }) =>
                    `text-sm transition ${
                      isActive
                        ? 'font-semibold text-observatory-cyan'
                        : 'text-observatory-muted hover:text-observatory-text'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg border border-observatory-border px-3 py-2 text-xs text-observatory-muted hover:border-observatory-cyan hover:text-observatory-text">
                <Keyboard size={14} /> Shortcuts
              </summary>
              <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-observatory-border bg-[#080f1c] p-4 shadow-2xl">
                <h2 className="text-sm font-semibold">Keyboard shortcuts</h2>
                <dl className="mt-3 space-y-2 text-xs">
                  <div className="flex justify-between gap-3"><dt className="text-observatory-muted">Focus sky viewer</dt><dd className="font-mono">+ / − / 0</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-observatory-muted">Timeline region focused</dt><dd className="font-mono">← / → / Space</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-observatory-muted">Explorer (not typing)</dt><dd className="font-mono">G / W</dd></div>
                </dl>
                <p className="mt-3 text-[11px] leading-5 text-observatory-muted">
                  G toggles Gaia DR3 and W toggles WISE. Keyboard shortcuts are disabled while entering text.
                </p>
              </div>
            </details>
          </div>
        </div>
      </header>

      <main id="main-content" tabIndex={-1} className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 outline-none focus-visible:outline-none sm:px-6 sm:py-10">
        <Outlet />
      </main>

      <footer className="border-t border-observatory-border px-6 py-5 text-center text-xs text-observatory-muted">
        SPHEREx Explorer · Astronomical data exploration
      </footer>
    </div>
  )
}
