import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@engine': path.resolve(__dirname, './src/engine'),
      '@entities': path.resolve(__dirname, './src/entities'),
      '@scenes': path.resolve(__dirname, './src/scenes'),
      '@systems': path.resolve(__dirname, './src/systems'),
      '@managers': path.resolve(__dirname, './src/managers'),
      '@data': path.resolve(__dirname, './src/data'),
    }
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  }
});
