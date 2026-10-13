import { Component, type ErrorInfo, type ReactNode } from 'react';

export default class AppErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('No se pudo abrir la pantalla de Coliflor:', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="page page--centered" role="alert">
        <div
          className="glass-card text-center stack stack--md"
          style={{ padding: 'var(--space-xl)', maxWidth: 360 }}
        >
          <h1 style={{ fontSize: 'var(--font-size-lg)' }}>No pudimos abrir esta pantalla</h1>
          <p className="text-secondary">Vuelve a cargar la página para intentarlo de nuevo.</p>
          <button className="btn btn--primary" onClick={() => window.location.reload()}>
            Volver a cargar
          </button>
          <a href="/">Ir a Inicio</a>
        </div>
      </main>
    );
  }
}
