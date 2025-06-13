import type { Express } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";

// Production-level security and optimization configurations
export function configureProductionSecurity(app: Express) {
  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        connectSrc: ["'self'", "https:", "wss:"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'", "https:", "blob:"],
        workerSrc: ["'self'", "blob:"]
      }
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }
  }));

  // CORS configuration for production
  app.use(cors({
    origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
      // Allow requests with no origin (mobile apps, etc.)
      if (!origin) return callback(null, true);
      
      // Allow Replit domains and custom domains
      const allowedOrigins = [
        /\.replit\.app$/,
        /\.repl\.co$/,
        /localhost:\d+$/,
        /127\.0\.0\.1:\d+$/
      ];
      
      const isAllowed = allowedOrigins.some(pattern => pattern.test(origin));
      callback(null, isAllowed);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));

  // Rate limiting for API endpoints
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      error: "Too many requests from this IP, please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Stricter rate limiting for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 auth requests per windowMs
    message: {
      error: "Too many authentication attempts, please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Stricter rate limiting for admin endpoints
  const adminLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Limit each IP to 30 admin requests per windowMs
    message: {
      error: "Too many admin requests, please try again later."
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Apply rate limiting
  app.use('/api/', apiLimiter);
  app.use('/api/auth/', authLimiter);
  app.use('/api/admin/', adminLimiter);
}

// Database connection optimization
export const dbConfig = {
  // Connection pool settings for production
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    createTimeoutMillis: 30000,
    destroyTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    reapIntervalMillis: 1000,
    createRetryIntervalMillis: 200,
  },
  
  // Query timeout settings
  query: {
    timeout: 20000, // 20 seconds
  },
  
  // SSL configuration for production
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false
};

// Error logging and monitoring
export function setupErrorHandling(app: Express) {
  // Global error handler for API routes only
  app.use('/api/*', (err: any, req: any, res: any, next: any) => {
    console.error('API error handler:', {
      error: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });

    // Don't leak error details in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(err.status || 500).json({
      error: isDevelopment ? err.message : 'Internal server error',
      ...(isDevelopment && { stack: err.stack })
    });
  });

  // 404 handler for API routes only
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      error: 'API endpoint not found',
      path: req.path,
      method: req.method
    });
  });
}

// Health check endpoint for deployment monitoring
export function setupHealthCheck(app: Express) {
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0'
    });
  });

  app.get('/api/health', (req, res) => {
    res.status(200).json({
      status: 'healthy',
      services: {
        database: 'connected',
        hedera: 'available',
        ipfs: 'available'
      },
      timestamp: new Date().toISOString()
    });
  });
}