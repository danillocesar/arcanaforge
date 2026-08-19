import { Component, type ErrorInfo, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

const wrapStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'var(--bg-body)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '40px 24px',
  textAlign: 'center',
  gap: 16,
};

const iconStyle: React.CSSProperties = { fontSize: '3rem' };
const titleStyle: React.CSSProperties = { fontSize: '1.3rem', fontWeight: 700, margin: 0 };
const msgStyle: React.CSSProperties = { fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: 420 };
const buttonStyle: React.CSSProperties = {
  marginTop: 8,
  padding: '10px 20px',
  borderRadius: 10,
  border: 'none',
  background: 'var(--accent, #9bb8d1)',
  color: '#0a0b0e',
  fontWeight: 700,
  fontSize: '0.9rem',
  cursor: 'pointer',
};

/**
 * Rede de segurança de topo: uma exceção de render em qualquer ponto da
 * árvore (ex.: dado malformado de um catálogo) derrubava o app inteiro
 * pra uma tela branca sem recuperação. Fallback deliberadamente sem
 * depender de nenhum componente de UI do app — só HTML/CSS vars, pra não
 * arriscar o próprio fallback quebrar junto.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erro não tratado capturado pelo ErrorBoundary:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={wrapStyle}>
          <span style={iconStyle}>⚠️</span>
          <h1 style={titleStyle}>Algo deu errado</h1>
          <p style={msgStyle}>
            Encontramos um erro inesperado. Recarregar a página costuma resolver — se persistir, avise o suporte.
          </p>
          <button style={buttonStyle} onClick={() => window.location.reload()}>
            Recarregar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
