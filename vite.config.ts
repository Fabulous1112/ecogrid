import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Two pages: the landing page at / and the live microgrid dashboard at /app/.
// `base: './'` keeps every asset path relative, so the build works on GitHub Pages
// (served from /ecogrid/) and on any static host without changes.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        app: resolve(import.meta.dirname, 'app/index.html'),
      },
      output: {
        // React is shared by both pages; the 3D stack is only loaded by the dashboard.
        manualChunks(id) {
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react';
          if (/node_modules\/(three|@react-three|postprocessing|three-stdlib)\//.test(id))
            return 'three';
          return undefined;
        },
      },
    },
    chunkSizeWarningLimit: 1200,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
