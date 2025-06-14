import { Request, Response, NextFunction } from "express";
import { log } from "./vite";

export function createBrowserDetectionMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check if this is a browser request to the deployed domain
    const host = req.get('host') || '';
    const userAgent = req.get('user-agent') || '';
    const isFromBrowser = userAgent.includes('Mozilla') || userAgent.includes('Chrome') || userAgent.includes('Safari');
    const isDeployedDomain = host.includes('.replit.app') || host.includes('.repl.co');
    
    // If it's a browser request to the deployed domain, force production mode
    if (isFromBrowser && isDeployedDomain && !req.path.startsWith('/api')) {
      log(`Browser deployment detected: ${host} - forcing static file serving`, "deployment");
      
      // Set production environment markers
      process.env.FORCE_PRODUCTION = 'true';
      
      // Add deployment headers
      res.header('X-Deployment-Mode', 'browser-production');
      res.header('X-Static-Serving', 'enabled');
    }
    
    next();
  };
}