import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Relative base allows deployment to https://<username>.github.io/<repo>/ seamlessly
  base: './',
  server: {
    port: 5173,
    host: true
  }
});
