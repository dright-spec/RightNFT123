import { log } from "./vite";

export function detectDeploymentEnvironment(): boolean {
  // Enhanced deployment detection with fallback for browser access
  const indicators = [
    process.env.NODE_ENV === "production",
    process.env.REPLIT_DEPLOYMENT === "1",
    process.env.REPL_DEPLOYMENT === "1",
    process.env.RAILWAY_ENVIRONMENT === "production",
    process.env.VERCEL_ENV === "production",
    process.env.NETLIFY === "true",
    // Check if we're running from a built dist file
    process.argv[1]?.includes("dist/index.js"),
    // Check if package.json scripts suggest production
    process.env.npm_lifecycle_event === "start",
    // Check if we're in a deployed Replit environment (no REPL_HOME in deployment)
    !process.env.REPL_HOME && process.env.REPLIT_CLUSTER,
    // Check if we have production-like environment
    process.env.PORT && process.env.PORT !== "5000"
  ];

  // Force production mode if running in deployed context (browser access)
  const isInBrowser = !!process.env.REPLIT_CLUSTER && !process.env.REPL_HOME;
  const isProduction = indicators.some(Boolean) || isInBrowser;
  
  log(`Deployment detection:`, "deployment");
  log(`  NODE_ENV: ${process.env.NODE_ENV}`, "deployment");
  log(`  REPLIT_DEPLOYMENT: ${process.env.REPLIT_DEPLOYMENT}`, "deployment");
  log(`  REPL_HOME: ${process.env.REPL_HOME}`, "deployment");
  log(`  REPLIT_CLUSTER: ${process.env.REPLIT_CLUSTER}`, "deployment");
  log(`  PORT: ${process.env.PORT}`, "deployment");
  log(`  npm_lifecycle_event: ${process.env.npm_lifecycle_event}`, "deployment");
  log(`  process.argv[1]: ${process.argv[1]}`, "deployment");
  log(`  Final decision: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`, "deployment");

  return isProduction;
}