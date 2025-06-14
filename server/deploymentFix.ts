import express, { type Express } from "express";
import path from "path";
import fs from "fs";
import { log } from "./vite";

export function setupDeploymentFix(app: Express) {
  // Force production mode detection for deployed environments
  const isDeployed = !process.env.REPL_HOME || process.env.REPLIT_CLUSTER || process.env.NODE_ENV === "production";
  
  if (isDeployed) {
    log("Deployment mode detected - setting up static file serving", "deployment");
    
    // Create a basic index.html if dist doesn't exist
    const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");
    const indexPath = path.join(distPath, "index.html");
    
    if (!fs.existsSync(distPath)) {
      fs.mkdirSync(distPath, { recursive: true });
    }
    
    if (!fs.existsSync(indexPath)) {
      const basicHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Dright - NFT Rights Marketplace</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      text-align: center;
    }
    .container { max-width: 600px; padding: 2rem; }
    h1 { font-size: 3rem; margin-bottom: 1rem; font-weight: 700; }
    .subtitle { font-size: 1.2rem; margin-bottom: 2rem; opacity: 0.9; }
    .features { text-align: left; margin: 2rem 0; }
    .feature { margin: 1rem 0; padding: 1rem; background: rgba(255,255,255,0.1); border-radius: 8px; }
    .btn { 
      background: rgba(255,255,255,0.2); 
      border: 2px solid white; 
      color: white; 
      padding: 1rem 2rem; 
      border-radius: 50px; 
      text-decoration: none; 
      display: inline-block; 
      margin: 1rem 0.5rem;
      transition: all 0.3s ease;
    }
    .btn:hover { background: white; color: #667eea; }
    .loading { margin-top: 2rem; opacity: 0.7; }
  </style>
</head>
<body>
  <div class="container">
    <h1>D<span style="color: #FFD700;">right</span></h1>
    <div class="subtitle">Web3 NFT Rights Marketplace on Hedera</div>
    
    <div class="features">
      <div class="feature">
        <strong>🎬 YouTube Integration</strong><br>
        Connect your YouTube account and mint NFTs from your videos with individual pricing controls
      </div>
      <div class="feature">
        <strong>⚡ OpenSea-Style Auctions</strong><br>
        Set fixed prices or create time-based auctions with reserve prices and custom durations
      </div>
      <div class="feature">
        <strong>💰 Royalty-Based Revenue</strong><br>
        Free NFT minting with royalties collected on future sales and transfers
      </div>
      <div class="feature">
        <strong>🔒 Hedera Blockchain</strong><br>
        Secure, fast, and eco-friendly NFT transactions on Hedera network
      </div>
    </div>
    
    <div>
      <a href="/api/rights" class="btn">View API</a>
      <a href="/health" class="btn">Health Check</a>
    </div>
    
    <div class="loading">
      Application is starting up...<br>
      <small>Please wait while the full interface loads</small>
    </div>
    
    <script>
      // Auto-refresh to load the full app once it's ready
      let attempts = 0;
      const maxAttempts = 10;
      
      function checkApp() {
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        }
      }
      
      // Start checking after 5 seconds
      setTimeout(checkApp, 5000);
    </script>
  </div>
</body>
</html>`;
      
      fs.writeFileSync(indexPath, basicHTML.trim());
      log("Created fallback index.html for deployment", "deployment");
    }
    
    // Serve static files
    app.use(express.static(distPath));
    
    // Handle SPA routing
    app.get("*", (req, res) => {
      if (!req.path.startsWith("/api") && !req.path.startsWith("/health")) {
        res.sendFile(indexPath);
      }
    });
    
    return true;
  }
  
  return false;
}