import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";
import { configureProductionSecurity, setupErrorHandling, setupHealthCheck } from "./productionConfig";
import path from "path";
import fs from "fs";

const app = express();

// CRITICAL: Browser deployment detection MUST come before everything else
app.use((req: Request, res: Response, next: NextFunction) => {
  const host = req.get('host') || '';
  const userAgent = req.get('user-agent') || '';
  const isFromBrowser = userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('Safari');
  const isDeployedDomain = host.includes('.replit.app') || host.includes('.repl.co');
  
  // Force static file serving for browser deployment requests
  if (isFromBrowser && isDeployedDomain && !req.path.startsWith('/api')) {
    log(`Browser deployment detected: ${host} - serving static file`, "deployment");
    
    const staticPath = path.resolve(import.meta.dirname, "..", "dist", "public", "index.html");
    if (fs.existsSync(staticPath)) {
      return res.sendFile(staticPath);
    }
  }
  
  next();
});

// Configure production-level security
configureProductionSecurity(app);

// Set up health checks
setupHealthCheck(app);

// Add deployment health check endpoint
app.get('/api/deployment/health', (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production' || 
                      process.env.REPLIT_DEPLOYMENT === '1' ||
                      (!process.env.REPL_HOME && !!process.env.REPLIT_CLUSTER);
  
  const staticPath = path.resolve(import.meta.dirname, "..", "dist", "public");
  const indexPath = path.join(staticPath, "index.html");
  const staticFilesExist = fs.existsSync(indexPath);
  
  res.json({
    status: 'healthy',
    mode: isProduction ? 'production' : 'development',
    staticFiles: staticFilesExist,
    staticPath: staticPath,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      REPLIT_DEPLOYMENT: process.env.REPLIT_DEPLOYMENT,
      REPL_HOME: !!process.env.REPL_HOME,
      REPLIT_CLUSTER: !!process.env.REPLIT_CLUSTER
    },
    timestamp: new Date().toISOString()
  });
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Simplified deployment detection as per Instructions.md
  const isProduction = process.env.NODE_ENV === 'production' || 
                      process.env.REPLIT_DEPLOYMENT === '1' ||
                      (!process.env.REPL_HOME && !!process.env.REPLIT_CLUSTER);
  
  log(`Deployment mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`, "deployment");
  log(`Environment variables: NODE_ENV=${process.env.NODE_ENV}, REPLIT_DEPLOYMENT=${process.env.REPLIT_DEPLOYMENT}`, "deployment");
  
  if (isProduction) {
    // Production: serve static files from dist/public
    log("Serving static files for production/deployment", "express");
    const staticPath = path.resolve(import.meta.dirname, "..", "dist", "public");
    const indexPath = path.join(staticPath, "index.html");
    
    log(`Static files path: ${staticPath}`, "deployment");
    log(`Index file path: ${indexPath}`, "deployment");
    
    // Serve static files
    app.use(express.static(staticPath, {
      maxAge: '1d',
      etag: true,
      lastModified: true
    }));
    
    // SPA fallback for all non-API routes
    app.get('*', (req, res) => {
      if (!req.path.startsWith('/api')) {
        log(`Serving SPA for: ${req.path}`, "deployment");
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
        } else {
          log(`Index file not found: ${indexPath}`, "deployment");
          res.status(404).send(`
            <html>
              <head><title>Dright NFT Marketplace</title></head>
              <body>
                <h1>Application Loading...</h1>
                <p>Static files not found. Build may be incomplete.</p>
                <p>Expected: ${indexPath}</p>
              </body>
            </html>
          `);
        }
      }
    });
  } else {
    // Development: use Vite dev server  
    log("Using Vite dev server for development", "express");
    await setupVite(app, server);
  }

  // Configure production error handling AFTER frontend routing
  setupErrorHandling(app);

  // Configure port for both development and deployment
  const port = parseInt(process.env.PORT || '5000', 10);
  
  server.listen(port, '0.0.0.0', () => {
    log(`serving on 0.0.0.0:${port}`);
    log(`environment: ${process.env.NODE_ENV || 'development'}`);
    log(`deployment: ${process.env.REPLIT_DEPLOYMENT || 'local'}`);
  });
})();
