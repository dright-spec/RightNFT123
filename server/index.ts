import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import { registerRoutes } from "./routes";
import { setupVite, log } from "./vite";
import { configureProductionSecurity, setupErrorHandling, setupHealthCheck } from "./productionConfig";
import { configureReservedVM, isReservedVM, getReservedVMPort, getReservedVMHost } from "./reserved-vm-config";
import path from "path";
import fs from "fs";

// Extend session data types
declare module 'express-session' {
  interface SessionData {
    userId?: number;
    walletAddress?: string;
    walletType?: string;
  }
}

const app = express();

// Cookie parsing middleware for session management
app.use(cookieParser());

// Session middleware for authentication
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// Enhanced domain detection for Reserved VM deployment
app.use((req: Request, res: Response, next: NextFunction) => {
  const host = req.get('host') || '';
  const isDeployedDomain = host.includes('.replit.app') || host.includes('.repl.co') || host.includes('.replit.dev');
  
  if (isDeployedDomain) {
    // Set deployment environment flag for Reserved VM
    process.env.DEPLOYMENT_DETECTED = 'true';
    res.header('X-Deployment-Mode', 'reserved-vm');
  }
  
  next();
});

// Configure production-level security
configureProductionSecurity(app);

// Configure Reserved VM specific settings
configureReservedVM(app);

// Set up health checks
setupHealthCheck(app);

// Add deployment health check endpoint for Reserved VM
app.get('/api/deployment/health', (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production' || 
                      process.env.REPLIT_DEPLOYMENT === '1' ||
                      process.env.DEPLOYMENT_DETECTED === 'true' ||
                      process.env.REPL_DEPLOYMENT === 'true' ||
                      (!process.env.REPL_HOME && !!process.env.REPLIT_CLUSTER);
  
  const staticPath = path.resolve(import.meta.dirname, "..", "dist", "public");
  const indexPath = path.join(staticPath, "index.html");
  const staticFilesExist = fs.existsSync(indexPath);
  
  res.json({
    status: 'healthy',
    mode: isProduction ? 'production' : 'development',
    deploymentType: 'reserved-vm',
    staticFiles: staticFilesExist,
    staticPath: staticPath,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      REPLIT_DEPLOYMENT: process.env.REPLIT_DEPLOYMENT,
      REPL_DEPLOYMENT: process.env.REPL_DEPLOYMENT,
      DEPLOYMENT_DETECTED: process.env.DEPLOYMENT_DETECTED,
      REPL_HOME: !!process.env.REPL_HOME,
      REPLIT_CLUSTER: !!process.env.REPLIT_CLUSTER,
      PORT: process.env.PORT
    },
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 5000,
    host: '0.0.0.0'
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

  // Enhanced deployment detection for Reserved VM
  const isProduction = process.env.NODE_ENV === 'production' || 
                      process.env.REPLIT_DEPLOYMENT === '1' ||
                      process.env.DEPLOYMENT_DETECTED === 'true' ||
                      process.env.REPL_DEPLOYMENT === 'true' ||
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

  // Configure port and host for Reserved VM deployment
  const port = getReservedVMPort();
  const host = getReservedVMHost();
  
  server.listen(port, host, () => {
    log(`serving on ${host}:${port}`);
    log(`environment: ${process.env.NODE_ENV || 'development'}`);
    log(`deployment type: ${isReservedVM() ? 'reserved-vm' : 'local'}`);
    log(`reserved vm detected: ${isReservedVM()}`);
    log(`deployment env vars: REPLIT_DEPLOYMENT=${process.env.REPLIT_DEPLOYMENT}, REPL_DEPLOYMENT=${process.env.REPL_DEPLOYMENT}`);
    log(`port from ENV: ${process.env.PORT || 'not set, using default 5000'}`);
  });
})();
