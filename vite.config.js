import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// A relative base lets the build work on GitHub Pages (served from /kennethpangestu-watch-next/).
export default defineConfig({
  plugins: [react()],
  base: './',
});
