#!/usr/bin/env node

import { build } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function buildProduction() {
  try {
    console.log('🚀 Starting production build...');
    
    // Build the client with proper alias resolution
    await build({
      root: path.resolve(__dirname, 'client'),
      resolve: {
        alias: {
          "@": path.resolve(__dirname, "client", "src"),
          "@shared": path.resolve(__dirname, "shared"),
          "@assets": path.resolve(__dirname, "attached_assets"),
        },
      },
      build: {
        outDir: path.resolve(__dirname, "dist/public"),
        emptyOutDir: true,
        rollupOptions: {
          output: {
            manualChunks: undefined,
          },
        },
      },
      plugins: [
        (await import('@vitejs/plugin-react')).default(),
      ],
    });
    
    console.log('✅ Production build completed successfully!');
    console.log('📁 Files built to: dist/public');
    
  } catch (error) {
    console.error('❌ Production build failed:', error);
    process.exit(1);
  }
}

buildProduction();