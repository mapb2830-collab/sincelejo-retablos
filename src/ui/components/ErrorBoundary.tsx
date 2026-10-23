import { Component, type ErrorInfo, type ReactNode } from 'react';
import { whatsappLink } from '../../adapters/whatsapp/whatsappOrderChannel';
import { env } from '../../config/env';

/** Último recurso: si una página falla, se muestra un mensaje útil en lugar de una pantalla en blanco. */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: unknown }, { failed: boolean; key?: unknown }> {
  state = { failed: false, key: this.props.resetKey };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  static getDerivedStateFromProps(props: { resetKey?: unknown }, state: { failed: boolean; key?: unknown }) {
    // Al navegar a otra página se intenta de nuevo.
    return props.resetKey !== state.key ? { failed: false, key: props.resetKey } : null;
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('Error en la página', error, info.componentStack);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div className="container">
        <div className="empty" role="alert">
          <h1 tabIndex={-1}>Algo salió mal en esta página</h1>
          <p>Intenta volver al inicio. Si el problema sigue, escríbenos y te ayudamos con tu pedido.</p>
          <p className="hero__ctas" style={{ justifyContent: 'center' }}>
            <a className="btn btn--primary" href="#/">Volver al inicio</a>
            <a className="btn btn--whatsapp" href={whatsappLink(env.whatsappNumber)} target="_blank" rel="noopener noreferrer">Escribir por WhatsApp</a>
          </p>
        </div>
      </div>
    );
  }
}
