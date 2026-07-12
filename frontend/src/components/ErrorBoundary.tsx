import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-surface-0 flex items-center justify-center px-4">
          <div className="glass-strong rounded-2xl p-8 border border-surface-200/40 text-center max-w-md w-full">
            <div className="w-14 h-14 rounded-full bg-danger-500/10 border border-danger-500/20 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">⚠</span>
            </div>
            <h1 className="text-lg font-bold text-surface-800 mb-2">Something went wrong</h1>
            <p className="text-sm text-surface-500 mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary !py-2 !px-6 !text-sm"
            >
              Refresh page
            </button>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-surface-500 cursor-pointer hover:text-surface-600">
                  Error details
                </summary>
                <pre className="mt-2 text-[10px] text-danger-400 bg-surface-50 border border-surface-200/40 rounded-xl p-3 overflow-x-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
