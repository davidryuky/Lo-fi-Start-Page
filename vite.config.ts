import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'configure-response-headers',
      apply: 'build',
      transformIndexHtml: (html) => {
        // Remove 'type="module"' and 'crossorigin' attributes to allow loading scripts via file:// protocol
        // Replaces type="module" with 'defer' to ensure script runs after HTML parsing
        return html
          .replace(/type="module"/g, 'defer')
          .replace(/crossorigin/g, '');
      }
    }
  ],
  base: './', // Ensures assets are linked relatively (e.g. ./assets/script.js)
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Disable code splitting for CSS to keep it simple (optional, prevents multiple small css files)
    cssCodeSplit: false, 
    rollupOptions: {
      output: {
        // 'iife' format bundles everything into a single immediate function
        // This avoids "ES Module" CORS errors on file:// protocol
        format: 'iife', 
        // Necessary for IIFE build to prevent splitting chunks
        inlineDynamicImports: true, 
        entryFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      }
    }
  }
});