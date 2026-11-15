import { ArrowRight, Orbit } from 'lucide-react'
import { Link } from 'react-router-dom'
import CoordinateSearch from './CoordinateSearch'
import TargetGrid from './TargetGrid'
import GuidedTour from './GuidedTour'

const steps = [
  ['01', 'Search', 'Choose a sky position or a preset target.'],
  ['02', 'Compare', 'Inspect observations across available epochs.'],
  ['03', 'Investigate', 'Explore spectra and potential detections.'],
  ['04', 'Share', 'Keep the investigation accessible by URL.'],
]

export default function HomePage() {
  return (
    <div className="relative isolate">
      <div
        aria-hidden="true"
        className="starfield-glow pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] opacity-70"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 75% 18%, rgba(109,40,217,.24), transparent 38%), radial-gradient(ellipse at 18% 35%, rgba(8,145,178,.15), transparent 35%), linear-gradient(180deg, rgba(9,15,31,.35), transparent)',
        }}
      />

      <section className="py-8 sm:py-14">
        <div className="mb-7 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-observatory-cyan">
          <Orbit size={16} />
          Infrared sky exploration
        </div>

        <div className="max-w-4xl">
          <h1 className="font-heading text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            Explore the
            <span className="block bg-gradient-to-r from-cyan-300 via-violet-300 to-fuchsia-400 bg-clip-text text-transparent">
              infrared universe.
            </span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-observatory-muted sm:text-lg">
            Search SPHEREx observations, compare the changing sky, inspect
            spectra, and investigate potential astronomical signals.
          </p>
        </div>

        <div className="mt-9">
          <CoordinateSearch />
        </div>

        <div className="mt-5 flex flex-wrap gap-3 text-xs text-observatory-muted">
          <span className="rounded-full border border-observatory-border px-3 py-1.5">
            102 spectral channels
          </span>
          <span className="rounded-full border border-observatory-border px-3 py-1.5">
            Multi-epoch exploration
          </span>
          <span className="rounded-full border border-observatory-border px-3 py-1.5">
            Gaia and WISE context
          </span>
        </div>
        <GuidedTour />
      </section>

      <section className="pb-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-observatory-cyan">
              Start exploring
            </p>
            <h2 className="mt-2 font-heading text-2xl font-semibold">
              Preset targets
            </h2>
          </div>
          <Link
            to="/about"
            className="inline-flex items-center gap-2 text-sm text-observatory-muted transition hover:text-observatory-cyan"
          >
            About the project <ArrowRight size={15} />
          </Link>
        </div>
        <TargetGrid />
      </section>

      <section className="border-t border-observatory-border py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-observatory-cyan">
          How it works
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {steps.map(([number, title, description]) => (
            <div
              key={number}
              className="rounded-xl border border-observatory-border bg-observatory-surface/70 p-5"
            >
              <span className="font-mono text-sm text-violet-300">{number}</span>
              <h3 className="mt-3 font-heading text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-observatory-muted">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}