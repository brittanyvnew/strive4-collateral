import { defineConfig } from 'vite';

// The dev server is started by server.ts (Express + Vite middleware) on port 3000.
export default defineConfig({
  server: { port: 3000, host: '0.0.0.0' },
});
