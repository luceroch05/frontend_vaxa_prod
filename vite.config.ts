import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  root: '.',
  publicDir: 'public',
  // En dev, las imágenes se sirven como archivo desde el backend en /uploads. El front
  // corre en otro puerto, así que proxeamos /uploads al backend para que los <img
  // src="/uploads/..."> carguen. En prod el backend sirve el front (mismo origen) y no hace falta.
  server: {
    proxy: {
      '/uploads': process.env.VITE_API_URL || 'http://localhost:4000',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
