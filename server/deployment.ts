import { log } from "./vite";

export function detectDeploymentEnvironment(): boolean {
  // Check multiple indicators for production/deployment environment
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
    process.env.npm_lifecycle_event === "start"
  ];

  const isProduction = indicators.some(Boolean);
  
  log(`Deployment detection:`, "deployment");
  log(`  NODE_ENV: ${process.env.NODE_ENV}`, "deployment");
  log(`  REPLIT_DEPLOYMENT: ${process.env.REPLIT_DEPLOYMENT}`, "deployment");
  log(`  npm_lifecycle_event: ${process.env.npm_lifecycle_event}`, "deployment");
  log(`  process.argv[1]: ${process.argv[1]}`, "deployment");
  log(`  Final decision: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`, "deployment");

  return isProduction;
}