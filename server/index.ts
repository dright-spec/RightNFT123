import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";
import { serveStatic } from "./static";
import { configureProductionSecurity, setupErrorHandling, setupHealthCheck } from "./productionConfig";
import { detectDeploymentEnvironment } from "./deployment";
import { setupDeploymentFix } from "./deploymentFix";
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

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  const isProduction = detectDeploymentEnvironment();
  


  // Always setup deployment configuration first
  setupDeploymentFix(app);
  
  // Enhanced production detection for browser deployments
  const hasReqlitCluster = !!process.env.REPLIT_CLUSTER;
  const isLocalDev = !!process.env.REPL_HOME;
  const forceProduction = hasReqlitCluster && !isLocalDev;
  
  if (isProduction || forceProduction) {
    // Production: serve static files
    log("Serving static files for production/deployment", "express");
    serveStatic(app);
  } else {
    // Development: use Vite dev server  
    log("Using Vite dev server for development", "express");
    await setupVite(app, server);
  }
  
  // Fallback: if no static files served and no vite, serve basic HTML
  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Dright - Loading...</title>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
              .loading { color: #666; }
            </style>
          </head>
          <body>
            <h1>Dright NFT Marketplace</h1>
            <p class="loading">Environment: ${isProduction ? 'Production' : 'Development'}</p>
            <p class="loading">Please wait while the application loads...</p>
            <script>
              console.log('Deployment debug info:', {
                isProduction: ${isProduction},
                nodeEnv: '${process.env.NODE_ENV}',
                replitDeployment: '${process.env.REPLIT_DEPLOYMENT}',
                lifecycle: '${process.env.npm_lifecycle_event}'
              });
              setTimeout(() => window.location.reload(), 3000);
            </script>
          </body>
        </html>
      `);
    }
  });

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
