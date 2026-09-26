import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Запросы /api во время разработки уходят на Express-сервер.
    proxy: { '/api': 'http://127.0.0.1:3000' },
  },
  build: {
    sourcemap: false,
  },
});
