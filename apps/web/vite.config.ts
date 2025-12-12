import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // GitHub Pages serves from /<repo>/, so use relative asset paths.
  // This keeps the build portable (also works via file:// for quick checks).
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
});
