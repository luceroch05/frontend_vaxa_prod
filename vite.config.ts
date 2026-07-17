import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// El .htaccess de producción se administra a mano en el servidor (lleva el env
// del backend en vaxasys.com y las reglas de SPA en cada subdominio). Vite copia
// public/.htaccess a dist/ automáticamente, y al subir el dist pisaría el de
// producción. Este plugin borra dist/.htaccess al terminar el build para que el
// paquete que subes NUNCA reemplace el .htaccess ya configurado en el servidor.
function omitirHtaccess() {
  return {
    name: 'omitir-htaccess',
    writeBundle(options: { dir?: string }) {
      const outDir = options.dir ?? path.resolve(__dirname, 'dist');
      const htaccess = path.join(outDir, '.htaccess');
      if (fs.existsSync(htaccess)) {
        fs.rmSync(htaccess);
        // eslint-disable-next-line no-console
        console.log('[omitir-htaccess] dist/.htaccess eliminado (se administra a mano en el servidor)');
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), omitirHtaccess()],
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
