import express, { type Express } from "express";
import path from "path";
import fs from "fs";
import { log } from "./vite";

export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "..", "dist", "public");
  
  log(`Setting up static file serving from: ${distPath}`, "static");
  
  // Check if the directory exists
  try {
    if (fs.existsSync(distPath)) {
      log(`Static directory exists: ${distPath}`, "static");
      const files = fs.readdirSync(distPath);
      log(`Files in static directory: ${files.join(', ')}`, "static");
    } else {
      log(`Static directory does not exist: ${distPath}`, "static");
    }
  } catch (error) {
    log(`Error checking static directory: ${error}`, "static");
  }
  
  // Serve static files from the built frontend
  app.use(express.static(distPath, {
    maxAge: '1y', // Cache static assets for better performance
    etag: true,
    lastModified: true,
  }));
  
  // Handle client-side routing - serve index.html for all non-API, non-health routes
  app.get("*", (req, res) => {
    // Skip API routes and health routes - they should be handled elsewhere
    if (req.path.startsWith("/api") || req.path === "/health") {
      return res.status(404).json({ error: "Endpoint not found" });
    }
    
    // For root route, check if Accept header prefers JSON (for health checks)
    if (req.path === "/" && req.get("Accept")?.includes("application/json")) {
      return res.status(200).json({
        status: 'healthy',
        message: 'Dright NFT Marketplace',
        timestamp: new Date().toISOString(),
        uptime: Math.round(process.uptime()),
        environment: process.env.NODE_ENV || 'development'
      });
    }
    
    const indexPath = path.join(distPath, "index.html");
    
    // Check if index.html exists before trying to serve it
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath, (err) => {
        if (err) {
          log(`Error serving index.html: ${err.message}`, "static");
          res.status(500).send(`
            <html>
              <body>
                <h1>Dright NFT Marketplace</h1>
                <p>Error loading application: ${err.message}</p>
                <p>Path attempted: ${indexPath}</p>
              </body>
            </html>
          `);
        }
      });
    } else {
      log(`index.html not found at: ${indexPath}`, "static");
      res.status(404).send(`
        <html>
          <body>
            <h1>Dright NFT Marketplace</h1>
            <p>Application not built for production deployment.</p>
            <p>Expected file: ${indexPath}</p>
            <p>Please run the build process before deployment.</p>
          </body>
        </html>
      `);
    }
  });
}