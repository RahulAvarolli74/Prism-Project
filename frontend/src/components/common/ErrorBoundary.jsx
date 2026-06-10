import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * Error Boundary Component
 * Catches React component errors and displays a recovery UI
 * Prevents entire app crash from single component failure
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    this.setState((prevState) => ({
      error,
      errorInfo,
      errorCount: prevState.errorCount + 1,
    }))

    // Log to monitoring service in production
    console.error('ErrorBoundary caught:', error, errorInfo)

    if (typeof window !== 'undefined' && window.__errorReporter) {
      window.__errorReporter({
        type: 'component_error',
        error: error.toString(),
        stack: errorInfo?.componentStack,
        timestamp: new Date().toISOString(),
      })
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 to-slate-900 p-4">
          <div className="max-w-md w-full rounded-2xl border border-red-500/20 bg-red-500/5 p-8 backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="rounded-full bg-red-500/10 p-3">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
              <h1 className="text-xl font-bold text-white">Something went wrong</h1>
            </div>

            {/* Error Details */}
            <div className="mb-6 space-y-3">
              <p className="text-sm text-slate-300">
                We encountered an unexpected error. Try refreshing or contact support if the issue persists.
              </p>

              {/* Error Message */}
              {this.state.error && (
                <div className="rounded-lg bg-red-950/30 p-3 border border-red-500/20">
                  <p className="text-xs font-mono text-red-300 break-words">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}

              {/* Dev Info - Only in dev mode */}
              {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
                <details className="text-xs">
                  <summary className="cursor-pointer text-slate-400 hover:text-slate-300">
                    Stack trace
                  </summary>
                  <pre className="mt-2 overflow-auto bg-slate-950 p-2 rounded text-red-300">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold transition-colors"
              >
                <RefreshCw size={16} />
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                className="flex-1 px-4 py-2 rounded-lg border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white font-semibold transition-colors"
              >
                Go Home
              </button>
            </div>

            {/* Error Count Warning */}
            {this.state.errorCount > 3 && (
              <div className="mt-4 rounded-lg bg-yellow-950/30 border border-yellow-500/20 p-3">
                <p className="text-xs text-yellow-300">
                  Multiple errors detected ({this.state.errorCount}). Please clear cache and reload.
                </p>
              </div>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
