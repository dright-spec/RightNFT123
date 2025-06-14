#!/usr/bin/env node

import http from 'http';

console.log('Testing browser deployment fix...');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/',
  method: 'GET',
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Host': 'example.replit.app'
  }
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    const isStaticHTML = data.includes('Dright') && data.includes('Connecting to production server');
    const isViteHTML = data.includes('@vite/client') && data.includes('createHotContext');
    
    console.log('\n--- Response Analysis ---');
    console.log(`Static HTML detected: ${isStaticHTML}`);
    console.log(`Vite dev HTML detected: ${isViteHTML}`);
    console.log(`Content length: ${data.length}`);
    console.log(`First 200 chars: ${data.substring(0, 200)}...`);
    
    if (isStaticHTML) {
      console.log('\n✅ SUCCESS: Browser deployment fix is working - serving static HTML');
    } else if (isViteHTML) {
      console.log('\n❌ ISSUE: Still serving Vite dev HTML instead of static files');
    } else {
      console.log('\n❓ UNKNOWN: Unexpected response format');
    }
  });
});

req.on('error', (e) => {
  console.error(`Request error: ${e.message}`);
});

req.end();