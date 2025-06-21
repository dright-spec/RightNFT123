import type { Express } from "express";

/**
 * Configuration specific to Replit Reserved VM deployments
 * Reserved VMs have different characteristics than Autoscale deployments
 */
export function configureReservedVM(app: Express) {
  // Set headers specific to Reserved VM
  app.use((req, res, next) => {
    res.header('X-Deployment-Type', 'reserved-vm');
    res.header('X-Powered-By', 'Replit Reserved VM');
    next();
  });

  // Reserved VM specific middleware
  app.use((req, res, next) => {
    // Log requests for debugging in Reserved VM environment
    if (process.env.NODE_ENV === 'production') {
      console.log(`[reserved-vm] ${req.method} ${req.path} - ${req.get('host')}`);
    }
    next();
  });
}

/**
 * Detect if running in Reserved VM environment
 */
export function isReservedVM(): boolean {
  return !!(
    process.env.REPL_DEPLOYMENT === 'true' ||
    process.env.REPLIT_DEPLOYMENT === '1' ||
    (process.env.NODE_ENV === 'production' && process.env.REPL_ID)
  );
}

/**
 * Get the appropriate port for Reserved VM
 */
export function getReservedVMPort(): number {
  // Reserved VMs typically use the PORT environment variable
  // or default to 5000 if not set
  return parseInt(process.env.PORT || '5000', 10);
}

/**
 * Get the appropriate host for Reserved VM
 */
export function getReservedVMHost(): string {
  // Reserved VMs should bind to 0.0.0.0 to accept external connections
  return '0.0.0.0';
}