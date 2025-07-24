// Authentication middleware for consistent API access control

import type { Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../api-types";
import { ApiResponseHelper, ApiErrorCode } from "../api-types";
import { marketplaceStorage as storage } from "../marketplaceStorage";

// Require authentication middleware
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Check session for user ID
    if (!req.session?.userId) {
      res.status(401).json(
        ApiResponseHelper.error("Authentication required", ApiErrorCode.UNAUTHORIZED)
      );
      return;
    }

    // Fetch user from database to ensure they still exist and aren't banned
    const user = await storage.getUser(req.session.userId);
    if (!user) {
      // Clear invalid session
      req.session.destroy((err) => {
        if (err) console.error("Session destruction error:", err);
      });
      res.status(401).json(
        ApiResponseHelper.error("Invalid session", ApiErrorCode.UNAUTHORIZED)
      );
      return;
    }

    // Check if user is banned
    if (user.isBanned) {
      res.status(403).json(
        ApiResponseHelper.error("Account suspended", ApiErrorCode.FORBIDDEN)
      );
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    res.status(500).json(
      ApiResponseHelper.error("Authentication failed", ApiErrorCode.INTERNAL_ERROR)
    );
  }
}

// Optional authentication middleware (for public endpoints that benefit from user context)
export async function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (req.session?.userId) {
      const user = await storage.getUser(req.session.userId);
      if (user && !user.isBanned) {
        req.user = user;
      }
    }
    next();
  } catch (error) {
    console.error("Optional auth middleware error:", error);
    // Don't fail the request, just continue without user context
    next();
  }
}

// Admin authentication middleware
export async function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // First check if user is authenticated
    if (!req.user) {
      await requireAuth(req, res, () => {});
      if (!req.user) return; // requireAuth already sent response
    }

    // Check if user has admin privileges
    // For now, we'll use a simple username check, but this could be role-based
    if (req.user.username !== 'admin' && !req.user.username?.startsWith('admin_')) {
      res.status(403).json(
        ApiResponseHelper.error("Admin access required", ApiErrorCode.FORBIDDEN)
      );
      return;
    }

    next();
  } catch (error) {
    console.error("Admin auth middleware error:", error);
    res.status(500).json(
      ApiResponseHelper.error("Admin authentication failed", ApiErrorCode.INTERNAL_ERROR)
    );
  }
}

// Wallet ownership verification middleware
export function requireWalletOwnership(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.session?.walletAddress) {
    res.status(401).json(
      ApiResponseHelper.error("Wallet connection required", ApiErrorCode.UNAUTHORIZED)
    );
    return;
  }

  next();
}

// Rate limiting middleware (basic implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    
    let userLimit = rateLimitMap.get(key);
    
    if (!userLimit || now > userLimit.resetTime) {
      userLimit = { count: 1, resetTime: now + windowMs };
      rateLimitMap.set(key, userLimit);
      next();
      return;
    }
    
    if (userLimit.count >= maxRequests) {
      res.status(429).json(
        ApiResponseHelper.error("Rate limit exceeded", ApiErrorCode.RATE_LIMITED)
      );
      return;
    }
    
    userLimit.count++;
    next();
  };
}

// Validation middleware factory
export function validateBody(schema: any) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    try {
      const validatedData = schema.parse(req.body);
      req.body = validatedData;
      next();
    } catch (error: any) {
      res.status(400).json(
        ApiResponseHelper.error(
          `Validation error: ${error.message}`,
          ApiErrorCode.VALIDATION_ERROR
        )
      );
    }
  };
}