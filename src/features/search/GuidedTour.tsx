import { useRef, useState } from 'react'
import { guidedTourSteps } from './tourSteps'

export default function GuidedTour() {
  const [open, setOpen] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const step = guidedTourSteps[stepIndex]

  function closeTour() {
    setOpen(false)
    setStepIndex(0)
    triggerRef.current?.focus()
  }

  return (
    <section className="mt-5">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-controls="guided-tour-panel"
        onClick={() => {
          if (open) closeTour()
          else setOpen(true)
        }}
        className="inline-flex items-center gap-2 rounded-lg border border-observatory-border px-4 py-2 text-sm text-observatory-muted transition hover:border-observatory-cyan hover:text-observatory-text"
      >
        {open ? 'Close guided tour' : 'Take a guided tour'}
      </button>

      {open && (
        <div
          id="guided-tour-panel"
          role="region"
          aria-label="SPHEREx Explorer guided tour"
          className="mt-3 max-w-2xl rounded-xl border border-observatory-border bg-observatory-surface p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <p
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="text-xs font-mono uppercase tracking-widest text-observatory-cyan"
            >
              Guided tour · Step {stepIndex + 1} of {guidedTourSteps.length}
            </p>
            <button
              type="button"
              onClick={closeTour}
              className="text-xs text-observatory-muted underline"
            >
              Finish
            </button>
          </div>
          <h3
            aria-live="polite"
            aria-atomic="true"
            className="mt-3 font-heading text-xl font-semibold"
          >
            {step.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-observatory-muted">
            {step.description}
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              aria-label="Previous tour step"
              disabled={stepIndex === 0}
              onClick={() => setStepIndex((value) => Math.max(0, value - 1))}
              className="rounded-lg border border-observatory-border px-4 py-2 text-sm disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              aria-label={stepIndex === guidedTourSteps.length - 1 ? 'Finish tour' : 'Next tour step'}
              onClick={() => {
                if (stepIndex === guidedTourSteps.length - 1) closeTour()
                else setStepIndex((value) => Math.min(guidedTourSteps.length - 1, value + 1))
              }}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
            >
              {stepIndex === guidedTourSteps.length - 1 ? 'Finish tour' : 'Next'}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
