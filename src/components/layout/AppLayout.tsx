import { NavLink, Outlet } from 'react-router-dom'
import { Orbit } from 'lucide-react'

const navigation = [
  { label: 'Home', path: '/', end: true },
  { label: 'Explorer', path: '/explore', end: false },
  { label: 'About', path: '/about', end: false },
]

export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-observatory-bg text-observatory-text">
      <header className="border-b border-observatory-border bg-observatory-surface/80">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <NavLink to="/" className="flex items-center gap-3">
            <Orbit className="h-7 w-7 text-observatory-cyan" />
            <span className="font-heading text-lg font-semibold tracking-wide">
              SPHEREx Explorer
            </span>
          </NavLink>

          <nav aria-label="Main navigation" className="flex items-center gap-6">
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
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-10">
        <Outlet />
      </main>

      <footer className="border-t border-observatory-border px-6 py-5 text-center text-xs text-observatory-muted">
        SPHEREx Explorer � Astronomical data exploration
      </footer>
    </div>
  )
}
