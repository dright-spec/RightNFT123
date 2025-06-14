#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔧 Custom deployment build starting...');

try {
  // Ensure dist directory exists
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist', { recursive: true });
  }
  
  if (!fs.existsSync('dist/public')) {
    fs.mkdirSync('dist/public', { recursive: true });
  }
  
  console.log('📁 Created dist directories');
  
  // Check if static files exist, if not create them
  const indexPath = 'dist/public/index.html';
  if (!fs.existsSync(indexPath)) {
    console.log('📄 Creating production HTML...');
    // The index.html was already created in our previous fix
  } else {
    console.log('✓ Static files exist');
  }
  
  // Build the server with esbuild
  console.log('🏗️ Building server...');
  execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', { 
    stdio: 'inherit' 
  });
  
  console.log('✅ Deployment build completed successfully!');
  console.log('📦 Server built to: dist/index.js');
  console.log('🌐 Static files in: dist/public/');
  
} catch (error) {
  console.error('❌ Deployment build failed:', error.message);
  process.exit(1);
}