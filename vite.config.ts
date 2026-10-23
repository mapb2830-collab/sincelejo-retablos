import { loadEnv, type Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/** Reemplaza __SITE_URL__ en index.html (metadatos para compartir enlaces necesitan URL absoluta). */
function siteUrl(mode: string): Plugin {
  const raw = loadEnv(mode, process.cwd(), 'VITE_').VITE_SITE_URL?.trim() ?? '';
  const url = raw && !raw.endsWith('/') ? `${raw}/` : raw;
  return {
    name: 'site-url',
    transformIndexHtml(html) {
      if (url) return html.replaceAll('__SITE_URL__', url);
      // Sin URL pública (local): se quitan las etiquetas que exigen URL absoluta y se dejan relativas las demás.
      return html
        .replace(/\s*<meta property="og:url"[^>]*>/, '')
        .replace(/\s*<link rel="canonical"[^>]*>/, '')
        .replace(/\s*"url": "__SITE_URL__",/, '')
        .replace(/\s*"logo": "__SITE_URL__[^"]*",/, '')
        .replace(/\s*"image": "__SITE_URL__[^"]*",/, '')
        .replaceAll('__SITE_URL__', './');
    },
  };
}

// base './' produce rutas relativas: el mismo build funciona en la raíz de un
// dominio, en un subdirectorio de GitHub Pages (usuario.github.io/repo/) o en local.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react(), siteUrl(mode)],
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  build: { target: 'es2020', sourcemap: false },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/unit/setup.ts'],
  },
}));
