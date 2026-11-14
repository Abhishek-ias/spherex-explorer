import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTargets } from '@/api/hooks/useTargets'
import { filterPresetTargets } from './targetSearch'

function TargetSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-observatory-border bg-observatory-surface p-5">
      <div className="h-4 w-1/2 rounded bg-slate-700" />
      <div className="mt-4 h-3 w-full rounded bg-slate-800" />
      <div className="mt-2 h-3 w-2/3 rounded bg-slate-800" />
    </div>
  )
}

export default function TargetGrid() {
  const { data, isPending, isError, error, refetch } = useTargets()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const filteredTargets = useMemo(
    () => filterPresetTargets(data ?? [], query),
    [data, query],
  )

  if (isPending) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 5 }, (_, index) => (
          <TargetSkeleton key={index} />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-900/70 bg-red-950/20 p-5">
        <p className="font-semibold text-red-300">Targets could not be loaded</p>
        <p className="mt-2 text-sm text-observatory-muted">
          {error.message}
        </p>
        <button
          onClick={() => void refetch()}
          className="mt-4 rounded-lg border border-observatory-border px-4 py-2 text-sm hover:border-observatory-cyan"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data?.length) {
    return (
      <div className="rounded-xl border border-dashed border-observatory-border bg-observatory-surface/50 p-7 text-center">
        <p className="font-semibold">No preset targets available</p>
        <p className="mt-2 text-sm text-observatory-muted">
          The API returned no target records. You can still search using
          coordinates above.
        </p>
        {import.meta.env.VITE_USE_MOCKS === 'true' && (
          <span className="mt-3 inline-block rounded-full bg-violet-500/15 px-3 py-1 text-xs text-violet-300">
            DEMO DATA mode
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <label className="block max-w-md text-sm">
        <span className="mb-2 block font-medium">Find a preset target</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter by name, category, or description"
          aria-label="Find a preset target"
          className="w-full rounded-lg border border-observatory-border bg-[#07101e] px-3 py-3 text-sm text-observatory-text outline-none focus:border-observatory-cyan"
        />
      </label>
      {filteredTargets.length === 0 ? (
        <div className="rounded-xl border border-dashed border-observatory-border bg-observatory-surface/50 p-7 text-center">
          <p className="font-semibold">No matching preset targets</p>
          <p className="mt-2 text-sm text-observatory-muted">
            Try another name, category, or description. This filter searches only
            the preset targets returned by the backend.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredTargets.map((target) => (
        <button
          key={target.id}
          onClick={() => {
            const params = new URLSearchParams({
              ra: target.ra_deg.toFixed(6),
              dec: target.dec_deg.toFixed(6),
              fov: '15',
            })
            navigate(`/explore?${params.toString()}`)
          }}
          className="group rounded-xl border border-observatory-border bg-observatory-surface p-5 text-left transition hover:-translate-y-1 hover:border-observatory-cyan/70"
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-heading text-lg font-semibold group-hover:text-observatory-cyan">
              {target.name}
            </h3>
            <span className="rounded-full bg-violet-500/15 px-2 py-1 text-xs text-violet-300">
              {target.category}
            </span>
          </div>
          <p className="mt-3 line-clamp-2 min-h-10 text-sm text-observatory-muted">
            {target.description}
          </p>
          <div className="mt-5 space-y-1 font-mono text-xs text-observatory-muted">
            <p>RA&nbsp;&nbsp; {target.ra}</p>
            <p>Dec&nbsp; {target.dec}</p>
          </div>
          <p className="mt-4 text-xs font-semibold text-observatory-cyan">
            Explore target →
          </p>
        </button>
          ))}
        </div>
      )}
    </div>
  )
}