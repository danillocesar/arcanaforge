import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backendPort = process.env.BACKEND_PORT || '3000';
const backendUrl = `http://localhost:${backendPort}`;

export default defineConfig({
  define: {
    'import.meta.env.VITE_BACKEND_WS_PORT': JSON.stringify(backendPort),
  },
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': backendUrl,
      '/avatars': backendUrl,
      '/assets': backendUrl,
    },
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
});
