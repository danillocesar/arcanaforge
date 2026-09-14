import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './api/authBootstrap';
import App from './App';
import { AuthProvider } from './features/auth';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';
import { ToastProvider } from './components/ui/Toast/Toast';
import './styles/globals.css';

// ToastProvider fica acima do router, e é o ÚNICO no app: ele registra o
// handler global de `services/toastService`, e o cleanup do provider zera esse
// handler. Dois providers aninhados se atropelariam — ao desmontar, o de dentro
// apagaria o registro do de fora, e o `showToast` de módulo morreria para o
// resto da sessão. Aqui, no root, ele nunca desmonta.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>,
);
