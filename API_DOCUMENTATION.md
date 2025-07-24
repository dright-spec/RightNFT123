# API Documentation

## Overview

The Dright API provides a comprehensive RESTful interface for managing intellectual property rights, staking, and administrative functions. All endpoints follow consistent patterns with standardized authentication, error handling, and response formats.

## Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.replit.app/api
```

## Authentication

The API uses session-based authentication with the following middleware:

### Authentication Types
- **requireAuth**: Requires valid user session
- **requireAdmin**: Requires admin privileges
- **optionalAuth**: User context if available, but not required

### Session Management
Sessions are managed via HTTP-only cookies and include:
- `userId`: Current user ID
- `walletAddress`: Connected wallet address

## Standard Response Format

All API endpoints return responses in the following format:

```typescript
interface ApiResponse<T> {
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
```

## Error Codes

| Code | Description |
|------|-------------|
| UNAUTHORIZED | Authentication required |
| FORBIDDEN | Access denied |
| NOT_FOUND | Resource not found |
| VALIDATION_ERROR | Request validation failed |
| DUPLICATE_RESOURCE | Resource already exists |
| INTERNAL_ERROR | Server error |
| RATE_LIMITED | Too many requests |

## Authentication Endpoints

### POST /api/auth/wallet
Connect with wallet address
```json
{
  "walletAddress": "0x742d35Cc...",
  "walletType": "ethereum"
}
```

### POST /api/auth/login
Login with email/username and password
```json
{
  "identifier": "user@example.com",
  "password": "password123"
}
```

### GET /api/auth/user
Get current authenticated user (requires auth)

### POST /api/auth/logout
Logout current session

## Rights Management

### GET /api/rights
Get rights with filtering and pagination
```
Query Parameters:
- page: number (default: 1)
- limit: number (default: 20)
- search: string
- type: string
- categoryId: number
- sortBy: string
- sortOrder: 'asc' | 'desc'
```

### GET /api/rights/:id
Get single right details

### POST /api/rights
Create new right (requires auth)
```json
{
  "title": "My Creative Work",
  "type": "copyright",
  "categoryId": 1,
  "description": "Description of the work",
  "price": "1.50",
  "currency": "ETH"
}
```

### PUT /api/rights/:id
Update right (requires auth + ownership)

### DELETE /api/rights/:id
Delete right (requires auth + ownership)

## Staking System

### GET /api/stakes/available-rights
Get user's own verified rights available for staking (requires auth)

### POST /api/stakes
Create new stake (requires auth)
```json
{
  "rightId": 1,
  "terms": "Special terms if any",
  "duration": "12"
}
```
Platform terms are fixed:
- Revenue Share: 75% to user
- Management Fee: 15%

### GET /api/stakes/user
Get current user's stakes (requires auth)

### GET /api/stakes/:id
Get single stake details (requires auth + ownership)

### PUT /api/stakes/:id
Update stake terms (requires auth + ownership)
```json
{
  "terms": "Updated terms"
}
```

### DELETE /api/stakes/:id
End stake (requires auth + ownership)

### GET /api/stakes/stats
Get user's staking statistics (requires auth)

## Admin Endpoints

### GET /api/admin/stats
Get platform statistics (requires admin)

### GET /api/admin/rights
Get rights for admin review (requires admin)
```
Query Parameters:
- status: 'all' | 'pending' | 'verified' | 'rejected'
- search: string
- page: number
- limit: number
```

### PUT /api/admin/rights/:id/verify
Verify or reject a right (requires admin)
```json
{
  "status": "verified",
  "notes": "Verification notes"
}
```

### GET /api/admin/rights/pending
Get pending rights for verification (requires admin)

### GET /api/admin/users
Get users for management (requires admin)

### PUT /api/admin/users/:id/ban
Toggle user ban status (requires admin)
```json
{
  "ban": true,
  "reason": "Violation reason"
}
```

### GET /api/stakes
Get all stakes (admin view, requires admin)

## Categories

### GET /api/categories
Get all available categories

## YouTube Verification

### POST /api/youtube/verify
Verify YouTube URL
```json
{
  "url": "https://youtube.com/watch?v=..."
}
```

### POST /api/youtube/authenticate
Authenticate YouTube ownership
```json
{
  "videoId": "dQw4w9WgXcQ",
  "originalUrl": "https://youtube.com/watch?v=dQw4w9WgXcQ",
  "authCode": "oauth_code"
}
```

## Rate Limiting

All API endpoints are rate limited to 200 requests per minute per IP address.

## CORS

CORS is configured to accept requests from the frontend domain with credentials support.

## Health Check

### GET /api/health
Returns server health status and database connectivity.

## Error Handling

All errors are returned with appropriate HTTP status codes and descriptive messages:

```json
{
  "success": false,
  "error": "Descriptive error message",
  "data": {
    "code": "ERROR_CODE"
  }
}
```

## Client Libraries

A TypeScript client library is available at `client/src/lib/api-client.ts` providing structured methods for all API operations with proper typing and error handling.

### Usage Example
```typescript
import api from '@/lib/api-client';

// Get available rights for staking
const rights = await api.staking.getAvailableRights();

// Create a stake
const stake = await api.staking.createStake({
  rightId: 1,
  duration: "12"
});

// Handle errors consistently
try {
  const result = await api.rights.createRight(rightData);
} catch (error) {
  const errorMessage = api.handleError(error);
  console.error(errorMessage);
}
```