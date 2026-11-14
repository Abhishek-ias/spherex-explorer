
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

      {/* Application header */}
      <header className="border-b border-observatory-border bg-observatory-surface">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-4 px-5 py-4">

          {/* Brand */}
          <NavLink to="/" className="flex items-center gap-3 no-underline">
            <Orbit className="h-7 w-7 text-observatory-cyan" />

            <div>
              <h1 className="font-heading text-lg font-semibold tracking-wide">
                SPHEREx Explorer
              </h1>
              <p className="text-xs tracking-wider text-observatory-muted">
                INFRARED SKY OBSERVATORY
              </p>
            </div>
          </NavLink>

          {/* Navigation */}
          <nav aria-label="Main navigation" className="flex items-center gap-2">
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-observatory-cyan/10 text-observatory-cyan'
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

      {/* Page content */}
      <main className="mx-auto w-full max-w-[1600px] flex-1 px-5 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-observatory-border px-5 py-4">
        <p className="text-center text-xs text-observatory-muted">
          SPHEREx Explorer · Frontend Foundation
        </p>
      </footer>

    </div>
  )
}
