import { defineConfig } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.')
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api/musicgen': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
       '/api/system': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
       '/api/settings': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
       '/api/llm': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
       '/api/publish': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
       '/api/export': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
       '/api/share': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/api/voice': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/api/ace': {
        target: 'http://127.0.0.1:8001',
        changeOrigin: true,
      },
      '/static': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
});