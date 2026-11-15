import { useApiHealth } from '@/api/hooks/useHealth'
import { readQualityFlagDefinitions } from '@/api/backendV21'

function getStatusLabel(status: string): string {
  const normalized = status.trim().toLowerCase()

  if (normalized === 'mock' || normalized === 'demo') return 'Mock API'
  if (normalized === 'ok' || normalized === 'healthy' || normalized === 'online') {
    return 'API connected'
  }

  return `API: ${status}`
}

export default function ApiHealthIndicator() {
  const { data, isPending, isError } = useApiHealth()
  const qualityFlags = readQualityFlagDefinitions(data)

  const label = isPending
    ? 'Checking API'
    : isError
      ? 'API unavailable'
      : getStatusLabel(data.status)

  const isConnected =
    data?.status.trim().toLowerCase() === 'ok' ||
    data?.status.trim().toLowerCase() === 'healthy' ||
    data?.status.trim().toLowerCase() === 'online'

  const dotClass = isError
    ? 'bg-rose-400'
    : isPending
      ? 'bg-observatory-muted'
      : isConnected
        ? 'bg-emerald-400'
        : 'bg-amber-400'

  const title = data
    ? `${data.service} · version ${data.version}`
    : isError
      ? 'The configured SPHEREx API could not be reached.'
      : 'Checking the configured SPHEREx API.'

  return (
    <>
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      title={title}
      className="inline-flex items-center gap-2 rounded-full border border-observatory-border px-3 py-1.5 text-xs text-observatory-muted"
    >
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${dotClass}`} />
      <span>{label}</span>
      {data?.version && (
        <span className="font-mono text-[10px] text-slate-300">v{data.version}</span>
      )}
    </div>
    {qualityFlags.length > 0 && (
      <details className="mt-2 rounded-lg border border-observatory-border bg-observatory-surface px-3 py-2 text-xs">
        <summary className="cursor-pointer text-observatory-muted">
          SPHEREx quality-flag dictionary · {qualityFlags.length} definitions
        </summary>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          {qualityFlags.map(({ bit, label: flagLabel }) => (
            <div key={bit} className="flex items-start gap-2">
              <dt className="min-w-8 font-mono text-observatory-cyan">Bit {bit}</dt>
              <dd className="text-observatory-text">{flagLabel}</dd>
            </div>
          ))}
        </dl>
      </details>
    )}
    </>
  )
}
