import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['references']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@engine': path.resolve(__dirname, './src/engine'),
      '@entities': path.resolve(__dirname, './src/entities'),
      '@scenes': path.resolve(__dirname, './src/scenes'),
      '@systems': path.resolve(__dirname, './src/systems'),
      '@managers': path.resolve(__dirname, './src/managers'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@data': path.resolve(__dirname, './src/data'),
      '@core': path.resolve(__dirname, './src/core'),
      '@ui': path.resolve(__dirname, './src/ui'),
    }
  },
  server: {
    port: 3000,
    open: true,
    fs: {
      deny: ['./**/references/**']
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  }
});
