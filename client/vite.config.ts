import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

export default defineConfig(({ mode }) => {
  /** Raiz + client: `client/.env` sobrepõe o da raiz. */
  const mergedVite = {
    ...loadEnv(mode, rootDir, 'VITE_'),
    ...loadEnv(mode, __dirname, 'VITE_'),
  };
  const defineFromEnv = Object.fromEntries(
    Object.entries(mergedVite).map(([key, value]) => [
      `import.meta.env.${key}`,
      JSON.stringify(value),
    ]),
  );

  const backendPort = process.env.BACKEND_PORT || '3000';
  const backendUrl = `http://localhost:${backendPort}`;

  return {
    define: {
      ...defineFromEnv,
      'import.meta.env.VITE_BACKEND_WS_PORT': JSON.stringify(backendPort),
    },
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': backendUrl,
        '/assets': backendUrl,
        // O callback do OAuth do Google é servido pelo Express, não pelo SPA.
        // Sem este proxy o Google redirecionaria para o dev server do Vite, que
        // devolveria o index.html e o vínculo nunca seria criado.
        // O prefixo é '/auth/google' e não '/auth' de propósito: '/auth' é a
        // rota de login do cliente, e proxiá-la quebraria a entrada do app.
        '/auth/google': backendUrl,
      },
    },
    build: {
      outDir: '../dist',
      emptyOutDir: true,
    },
  };
});
