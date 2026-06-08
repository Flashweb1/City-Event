import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: 'var(--spacing-xl)',
          textAlign: 'center',
          background: 'var(--deep-black)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: 'var(--spacing-md)' }}>
            ⚠️
          </div>
          <h1 style={{ color: 'var(--neon-pink)', marginBottom: 'var(--spacing-md)' }}>
            Something Went Wrong
          </h1>
          <p style={{ color: 'var(--light-gray)', marginBottom: 'var(--spacing-lg)', maxWidth: '600px' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => window.location.reload()}
              className="btn-primary"
              style={{ padding: '1rem 2rem' }}
            >
              Reload Page
            </button>
            <a href="/">
              <button className="btn-secondary" style={{ padding: '1rem 2rem' }}>
                Go Home
              </button>
            </a>
          </div>
          {process.env.NODE_ENV === 'development' && (
            <details style={{ marginTop: 'var(--spacing-xl)', textAlign: 'left', maxWidth: '800px' }}>
              <summary style={{ cursor: 'pointer', color: 'var(--neon-cyan)' }}>
                Error Details (Dev Only)
              </summary>
              <pre style={{
                background: 'var(--dark-gray)',
                padding: 'var(--spacing-md)',
                borderRadius: 'var(--radius-sm)',
                overflow: 'auto',
                marginTop: 'var(--spacing-md)',
                color: 'var(--neon-pink)'
              }}>
                {this.state.error?.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
