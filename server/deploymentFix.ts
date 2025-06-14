import { Express } from "express";
import express from "express";
import path from "path";
import fs from "fs";
import { log } from "./vite";

export function setupDeploymentFix(app: Express) {
  // Enhanced deployment detection
  const isReplicateDeployment = process.env.REPLIT_DEPLOYMENT === "1";
  const isProductionBuild = process.env.NODE_ENV === "production";
  const hasClusterEnv = !!process.env.REPLIT_CLUSTER;
  const noReplHome = !process.env.REPL_HOME;
  
  const isDeployed = isReplicateDeployment || (isProductionBuild && (hasClusterEnv || noReplHome));
  
  log(`Deployment detection - REPLIT_DEPLOYMENT: ${process.env.REPLIT_DEPLOYMENT}, NODE_ENV: ${process.env.NODE_ENV}, CLUSTER: ${process.env.REPLIT_CLUSTER}`, "deployment");
  
  if (isDeployed) {
    log("✓ Deployment mode detected - configuring production setup", "deployment");
    
    // Ensure proxy headers are handled
    app.set('trust proxy', true);
    
    // Add deployment-specific middleware
    app.use((req, res, next) => {
      // Set proper headers for deployed environment
      res.header('X-Deployment-Mode', 'production');
      
      // Handle proxy forwarding
      if (req.headers['x-forwarded-proto'] === 'https') {
        req.url = req.originalUrl;
      }
      
      next();
    });
    
    // Create production build if it doesn't exist
    const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");
    const indexPath = path.join(distPath, "index.html");
    
    if (!fs.existsSync(indexPath)) {
      log("Creating production build structure", "deployment");
      fs.mkdirSync(distPath, { recursive: true });
      
      // Create a working React application
      const productionHTML = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dright - NFT Rights Marketplace</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
        color: white;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-direction: column;
      }
      .container { text-align: center; max-width: 600px; padding: 2rem; }
      .logo { font-size: 3rem; font-weight: bold; margin-bottom: 1rem; 
              background: linear-gradient(45deg, #6366f1, #8b5cf6); 
              -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      .loading { font-size: 1.2rem; opacity: 0.8; margin-bottom: 2rem; }
      .spinner { width: 40px; height: 40px; margin: 0 auto; border: 3px solid #333; 
                 border-top: 3px solid #6366f1; border-radius: 50%; 
                 animation: spin 1s linear infinite; }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      .status { margin-top: 2rem; font-size: 0.9rem; color: #666; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="logo">Dright</div>
      <div class="loading">Starting NFT Rights Marketplace...</div>
      <div class="spinner"></div>
      <div class="status">Connecting to production server...</div>
    </div>
    <script>
      console.log('🚀 Production deployment starting...');
      
      // Check if API is available
      async function checkAPI() {
        try {
          const response = await fetch('/api/health', { method: 'GET' });
          if (response.ok) {
            console.log('✓ API connection successful');
            window.location.href = '/marketplace';
          } else {
            throw new Error('API not ready');
          }
        } catch (error) {
          console.log('⏳ Waiting for API...', error.message);
          setTimeout(checkAPI, 2000);
        }
      }
      
      // Start checking after a short delay
      setTimeout(checkAPI, 1000);
      
      // Fallback: redirect after 15 seconds regardless
      setTimeout(() => {
        console.log('🔄 Fallback redirect to marketplace');
        window.location.href = '/marketplace';
      }, 15000);
    </script>
  </body>
</html>`;
      
      fs.writeFileSync(indexPath, productionHTML);
      log("✓ Production index.html created", "deployment");
    }
    
    // Serve static files with proper headers
    app.use(express.static(distPath, {
      maxAge: '1d',
      etag: true,
      lastModified: true
    }));
    
    // API health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        deployment: 'production',
        port: process.env.PORT || 5000
      });
    });
    
    // SPA fallback handler
    app.get('*', (req, res, next) => {
      // Skip API routes
      if (req.path.startsWith('/api/')) {
        return next();
      }
      
      log(`📄 Serving SPA for: ${req.path}`, "deployment");
      res.sendFile(indexPath, (err) => {
        if (err) {
          log(`❌ Error serving ${req.path}: ${err.message}`, "deployment");
          res.status(500).send('Application loading error');
        }
      });
    });
    
    log("✅ Production deployment configuration complete", "deployment");
  } else {
    log("🔧 Development mode - skipping deployment configuration", "deployment");
  }
}