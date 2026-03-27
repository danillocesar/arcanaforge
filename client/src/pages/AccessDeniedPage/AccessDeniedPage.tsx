import { useNavigate } from 'react-router-dom';
import Topbar from '../../components/layout/Topbar/Topbar';
import Button from '../../components/ui/Button/Button';

const wrapStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'var(--bg-body)',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font)',
  display: 'flex',
  flexDirection: 'column',
};

const contentStyle: React.CSSProperties = {
  flex: 1,
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

export default function AccessDeniedPage() {
  const navigate = useNavigate();

  return (
    <div style={wrapStyle}>
      <Topbar title="Acesso Negado" />
      <div style={contentStyle}>
        <span style={iconStyle}>🔒</span>
        <h1 style={titleStyle}>Acesso negado</h1>
        <p style={msgStyle}>
          Você não tem permissão para acessar este conteúdo. Verifique se você faz parte deste grupo ou se este personagem pertence a você.
        </p>
        <Button variant="primary" onClick={() => navigate('/parties')}>
          Ir para Grupos
        </Button>
      </div>
    </div>
  );
}
