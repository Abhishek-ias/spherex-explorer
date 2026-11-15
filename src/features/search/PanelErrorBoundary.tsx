import { Component, type ErrorInfo, type ReactNode } from 'react'

type Props = {
  panelName: string
  children: ReactNode
}

type State = {
  error: Error | null
}

export default class PanelErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`SPHEREx ${this.props.panelName} panel error:`, error, info)
  }

  private retry = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        <section
          role="alert"
          className="rounded-xl border border-amber-500/30 bg-observatory-surface p-5"
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-300">
            Panel error
          </p>
          <h2 className="mt-2 font-semibold">
            {this.props.panelName} is temporarily unavailable
          </h2>
          <p className="mt-2 text-sm text-observatory-muted">
            This panel failed to render. Other explorer panels remain available.
          </p>
          <button
            type="button"
            onClick={this.retry}
            className="mt-4 rounded-lg border border-observatory-border px-3 py-2 text-xs hover:border-observatory-cyan"
          >
            Retry panel
          </button>
        </section>
      )
    }

    return this.props.children
  }
}
