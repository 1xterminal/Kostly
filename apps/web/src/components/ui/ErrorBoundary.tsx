import React, { Component, type ReactNode } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  children: ReactNode
  /** Optional custom fallback UI. Receives the error and a reset callback. */
  fallback?: (error: Error, reset: () => void) => ReactNode
}

interface State {
  error: Error | null
}

// ─── Error Boundary ───────────────────────────────────────────────────────────

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  reset = () => this.setState({ error: null })

  render() {
    const { error } = this.state

    if (error) {
      if (this.props.fallback) {
        return this.props.fallback(error, this.reset)
      }

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '64px 32px',
          gap: 16,
          fontFamily: "'Inter', sans-serif",
          color: '#111827',
        }}>
          <div style={{ fontSize: 40 }}>⚠️</div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
            Something went wrong
          </h2>
          <p style={{ margin: 0, color: '#6B7280', fontSize: 14, textAlign: 'center', maxWidth: 380 }}>
            {error.message || 'An unexpected error occurred. Please try again.'}
          </p>
          <button
            onClick={this.reset}
            style={{
              marginTop: 8,
              padding: '10px 20px',
              backgroundColor: '#3045AF',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// ─── Page-level Suspense + ErrorBoundary wrapper ──────────────────────────────

export function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <React.Suspense fallback={<PageSkeleton />}>
        {children}
      </React.Suspense>
    </ErrorBoundary>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {[1, 2, 3].map(i => (
        <div
          key={i}
          style={{
            height: 80,
            borderRadius: 12,
            backgroundColor: '#E5E7EB',
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        />
      ))}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
