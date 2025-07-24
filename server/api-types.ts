// Unified API types and interfaces for cohesive backend-frontend integration

import type { Request, Response, NextFunction } from "express";
import type { User, Right, Stake, Transaction } from "@shared/schema";

// Extend Express Request with user session
export interface AuthenticatedRequest extends Request {
  user?: User;
  session: {
    userId?: number;
    walletAddress?: string;
  } & Request['session'];
}

// Standard API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    hasMore?: boolean;
  };
}

// Authentication middleware type
export type AuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => void | Promise<void>;

// Standard error types
export enum ApiErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  RATE_LIMITED = 'RATE_LIMITED'
}

// Paginated query parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

// Standard filter parameters
export interface FilterParams {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  type?: string;
  categoryId?: number;
  status?: string;
}

// Query parameters combining pagination and filters
export interface QueryParams extends PaginationParams, FilterParams {
  userId?: number;
}

// Right creation and update types
export interface CreateRightRequest {
  title: string;
  type: string;
  categoryId: number;
  description: string;
  tags?: string[];
  price: string;
  currency?: string;
  paysDividends?: boolean;
  royaltyPercentage?: string;
  contentFileHash?: string;
  contentFileUrl?: string;
  ownershipDocumentHash?: string;
  ownershipDocumentUrl?: string;
}

// Stake creation request
export interface CreateStakeRequest {
  rightId: number;
  terms?: string;
  duration?: string;
}

// Transaction types for blockchain operations
export interface TransactionRequest {
  rightId: number;
  amount: string;
  currency: string;
  buyerAddress: string;
  type: 'purchase' | 'bid' | 'mint';
}

// Admin verification request
export interface VerificationRequest {
  rightId: number;
  status: 'verified' | 'rejected';
  notes?: string;
}

// Response helpers
export class ApiResponseHelper {
  static success<T>(data: T, message?: string, meta?: ApiResponse['meta']): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
      meta
    };
  }

  static error(error: string, code: ApiErrorCode = ApiErrorCode.INTERNAL_ERROR): ApiResponse {
    return {
      success: false,
      error,
      data: { code }
    };
  }

  static paginated<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
    message?: string
  ): ApiResponse<T[]> {
    return {
      success: true,
      data,
      message,
      meta: {
        total,
        page,
        limit,
        hasMore: (page * limit) < total
      }
    };
  }
}

// Error handling utility
export function handleApiError(error: unknown, res: Response): void {
  console.error('API Error:', error);
  
  if (error instanceof Error) {
    // Handle known error types
    if (error.message.includes('duplicate') || error.message.includes('unique')) {
      res.status(409).json(ApiResponseHelper.error(error.message, ApiErrorCode.DUPLICATE_RESOURCE));
    } else if (error.message.includes('not found')) {
      res.status(404).json(ApiResponseHelper.error(error.message, ApiErrorCode.NOT_FOUND));
    } else if (error.message.includes('validation') || error.message.includes('invalid')) {
      res.status(400).json(ApiResponseHelper.error(error.message, ApiErrorCode.VALIDATION_ERROR));
    } else {
      res.status(500).json(ApiResponseHelper.error('Internal server error', ApiErrorCode.INTERNAL_ERROR));
    }
  } else {
    res.status(500).json(ApiResponseHelper.error('Unknown error occurred', ApiErrorCode.INTERNAL_ERROR));
  }
}

// Async handler wrapper to catch errors
export function asyncHandler(fn: Function) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      handleApiError(error, res);
    });
  };
}