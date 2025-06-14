#!/usr/bin/env node

// Production deployment wrapper that ensures proper build and startup
import { execSync } from 'child_process';
import fs from 'fs';

console.log('🚀 Production deployment starting...');

try {
  // Ensure build is up to date
  if (!fs.existsSync('dist/index.js')) {
    console.log('Building server for production...');
    execSync('node deploy-build.js', { stdio: 'inherit' });
  }
  
  // Set production environment
  process.env.NODE_ENV = 'production';
  process.env.REPLIT_DEPLOYMENT = '1';
  
  // Import and run the built server
  console.log('Starting production server...');
  import('./dist/index.js');
  
} catch (error) {
  console.error('Production startup failed:', error);
  process.exit(1);
}