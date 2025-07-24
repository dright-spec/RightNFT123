# Dright API Documentation

## Overview

The Dright API provides comprehensive access to intellectual property rights marketplace functionality. Built with RESTful principles, our API enables developers to integrate rights management, staking systems, and marketplace operations into their applications.

## Base Information

- **Base URL**: `https://your-domain.replit.app/api`
- **Protocol**: HTTPS only
- **Format**: JSON
- **Authentication**: Session-based with cookie support
- **Rate Limiting**: Applied per endpoint (see individual sections)

## Authentication

### Overview
Dright supports multiple authentication methods to accommodate different use cases and user preferences.

### 1. Wallet Authentication (Recommended)

Connect users via their Web3 wallets for seamless blockchain integration.

**Endpoint**: `POST /api/auth/wallet`

**Request Body**:
```json
{
  "walletAddress": "0x742d35Cc6634C0532925a3b8C3c7E6E6B6b16d4d",
  "walletType": "ethereum"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "crypto_user_123",
      "walletAddress": "0x742d35Cc6634C0532925a3b8C3c7E6E6B6b16d4d",
      "displayName": "Crypto User",
      "createdAt": "2025-01-15T10:30:00Z"
    }
  },
  "message": "Wallet connected successfully"
}
```

### 2. Traditional Login

Standard email/password authentication for traditional applications.

**Endpoint**: `POST /api/auth/login`

**Request Body**:
```json
{
  "identifier": "user@example.com",
  "password": "securePassword123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "john_creator",
      "email": "user@example.com",
      "displayName": "John Creator"
    }
  },
  "message": "Login successful"
}
```

### 3. Session Management

**Get Current User**
- **Endpoint**: `GET /api/auth/user`
- **Authentication**: Required
- **Description**: Retrieve currently authenticated user information

**Logout**
- **Endpoint**: `POST /api/auth/logout`
- **Authentication**: Required
- **Description**: End current session and clear authentication cookies

## Rights Management

### List Rights

**Endpoint**: `GET /api/rights`
**Authentication**: None (public endpoint)
**Rate Limit**: 200 requests/minute

**Query Parameters**:
- `page` (integer): Page number for pagination (default: 1)
- `limit` (integer): Number of results per page (max: 100, default: 20)
- `search` (string): Search term for title/description
- `type` (string): Filter by right type (`copyright`, `royalty`, `access`, `ownership`, `license`)
- `categoryId` (integer): Filter by category ID
- `verificationStatus` (string): Filter by status (`pending`, `verified`, `rejected`)
- `priceMin` (string): Minimum price filter
- `priceMax` (string): Maximum price filter
- `sortBy` (string): Sort field (`createdAt`, `price`, `title`, `updatedAt`)
- `sortOrder` (string): Sort direction (`asc`, `desc`)

**Example Request**:
```
GET /api/rights?page=1&limit=10&type=copyright&sortBy=createdAt&sortOrder=desc
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Sunset Photography Collection",
      "type": "copyright",
      "price": "2.50",
      "currency": "ETH",
      "description": "Beautiful sunset photographs from around the world",
      "verificationStatus": "verified",
      "paysDividends": true,
      "royaltyPercentage": "15.00",
      "tags": ["photography", "nature", "art"],
      "creator": {
        "id": 5,
        "username": "photo_artist",
        "displayName": "Photo Artist"
      },
      "createdAt": "2025-07-20T14:22:00Z"
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 10,
    "hasMore": true,
    "totalPages": 15
  }
}
```

### Get Single Right

**Endpoint**: `GET /api/rights/:id`
**Authentication**: None
**Rate Limit**: 500 requests/minute

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Sunset Photography Collection",
    "type": "copyright",
    "description": "Beautiful sunset photographs from around the world",
    "price": "2.50",
    "currency": "ETH",
    "paysDividends": true,
    "royaltyPercentage": "15.00",
    "verificationStatus": "verified",
    "tags": ["photography", "nature", "art"],
    "creator": {
      "id": 5,
      "username": "photo_artist",
      "displayName": "Photo Artist",
      "profileImageUrl": "https://example.com/avatar.jpg"
    },
    "category": {
      "id": 1,
      "name": "Visual Arts"
    },
    "createdAt": "2025-07-20T14:22:00Z",
    "updatedAt": "2025-07-22T09:15:00Z"
  }
}
```

### Create Right

**Endpoint**: `POST /api/rights`
**Authentication**: Required
**Rate Limit**: 100 requests/hour

**Request Body**:
```json
{
  "title": "My Original Song",
  "type": "copyright",
  "categoryId": 2,
  "description": "An original composition I created",
  "price": "1.50",
  "currency": "ETH",
  "paysDividends": true,
  "royaltyPercentage": "10.00",
  "tags": ["music", "original", "indie"],
  "contentSourceType": "music_track",
  "ownershipDocumentUrl": "https://ipfs.io/ipfs/Qm...",
  "previewImageUrl": "https://ipfs.io/ipfs/Qm..."
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 42,
    "title": "My Original Song",
    "type": "copyright",
    "price": "1.50",
    "currency": "ETH",
    "verificationStatus": "pending",
    "ownerId": 1,
    "createdAt": "2025-07-24T11:30:00Z"
  },
  "message": "Right created successfully"
}
```

## Staking System

### Get Available Rights for Staking

**Endpoint**: `GET /api/stakes/available-rights`
**Authentication**: Required
**Description**: Get user's own verified rights that can be staked

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 3,
      "title": "Mobile App UI Design",
      "type": "copyright",
      "verificationStatus": "verified",
      "price": "3.00",
      "currency": "ETH",
      "paysDividends": true,
      "currentlyStaked": false
    }
  ],
  "message": "Available rights for staking retrieved successfully"
}
```

### Create Stake

**Endpoint**: `POST /api/stakes`
**Authentication**: Required
**Rate Limit**: 50 requests/hour

**Platform Terms** (Fixed):
- User Revenue Share: 75%
- Management Fee: 15%
- Platform Fee: 10%

**Request Body**:
```json
{
  "rightId": 3,
  "terms": "Professional revenue management for mobile app design rights",
  "duration": "12"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 15,
    "rightId": 3,
    "stakerId": 1,
    "status": "active",
    "revenueSharePercentage": 75,
    "managementFee": 15,
    "terms": "Professional revenue management for mobile app design rights",
    "duration": "12",
    "startDate": "2025-07-24T11:30:00Z",
    "endDate": "2026-07-24T11:30:00Z"
  },
  "message": "Stake created successfully"
}
```

### Get User Stakes

**Endpoint**: `GET /api/stakes/user`
**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 15,
      "status": "active",
      "revenueSharePercentage": 75,
      "totalRevenue": "0.45",
      "stakerEarnings": "0.34",
      "managementFee": 15,
      "right": {
        "id": 3,
        "title": "Mobile App UI Design",
        "type": "copyright"
      },
      "startDate": "2025-07-24T11:30:00Z",
      "endDate": "2026-07-24T11:30:00Z",
      "revenueDistributions": [
        {
          "id": 1,
          "amount": "0.45",
          "stakerAmount": "0.34",
          "distributedAt": "2025-07-24T15:30:00Z",
          "source": "Licensing Deal"
        }
      ]
    }
  ],
  "message": "User stakes retrieved successfully"
}
```

### Get Staking Statistics

**Endpoint**: `GET /api/stakes/stats`
**Authentication**: Required

**Response**:
```json
{
  "success": true,
  "data": {
    "totalStakes": 3,
    "activeStakes": 2,
    "totalEarnings": 1.25,
    "availableRights": 5,
    "averageRevenueShare": 75,
    "platformFee": 15,
    "lifetimeRevenue": 2.85,
    "monthlyEarnings": 0.32
  },
  "message": "Staking statistics retrieved successfully"
}
```

## Admin Endpoints

**Note**: All admin endpoints require administrator privileges.

### Get Platform Statistics

**Endpoint**: `GET /api/admin/stats`
**Authentication**: Admin required
**Rate Limit**: 100 requests/hour

**Response**:
```json
{
  "success": true,
  "data": {
    "totalUsers": 245,
    "totalRights": 1832,
    "pendingVerifications": 23,
    "verifiedRights": 1756,
    "rejectedRights": 53,
    "bannedUsers": 3,
    "totalRevenue": "45.67",
    "currency": "ETH",
    "monthlyGrowth": 15.2,
    "activeStakes": 142,
    "totalStakingRevenue": "12.34"
  },
  "message": "Admin statistics retrieved successfully"
}
```

### Verify Right

**Endpoint**: `PUT /api/admin/rights/:id/verify`
**Authentication**: Admin required
**Rate Limit**: 200 requests/hour

**Request Body**:
```json
{
  "status": "verified",
  "notes": "All ownership documents verified successfully"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 42,
    "title": "My Original Song",
    "verificationStatus": "verified",
    "verifiedAt": "2025-07-24T11:35:00Z",
    "verifiedBy": "admin",
    "verificationNotes": "All ownership documents verified successfully"
  },
  "message": "Right verified successfully"
}
```

## Error Handling

### Error Response Format

All API errors follow a consistent format:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data provided",
    "details": {
      "field": "title",
      "message": "Title must be at least 3 characters long"
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request data validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate) |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Internal server error |

### Rate Limiting

Rate limits are applied per IP address (for public endpoints) or per authenticated user (for protected endpoints).

**Headers**:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Unix timestamp when limit resets

**Rate Limit Response**:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Try again later.",
    "retryAfter": 60
  }
}
```

## SDKs and Integration

### TypeScript/JavaScript Client

Our official TypeScript client provides a fully typed interface to the API:

```typescript
import api from '@/lib/api-client';

// All methods include proper TypeScript types
const rights = await api.rights.getRights({ page: 1 });
const user = await api.auth.connectWallet(address, "ethereum");
const stake = await api.staking.createStake({ rightId: 1, duration: "12" });

// Error handling
try {
  const result = await api.rights.createRight(rightData);
} catch (error) {
  const message = api.handleError(error);
  console.error('API Error:', message);
}
```

### cURL Examples

**List Rights**:
```bash
curl -X GET "https://your-domain.replit.app/api/rights?page=1&limit=5" \
  -H "Content-Type: application/json"
```

**Authenticate with Wallet**:
```bash
curl -X POST "https://your-domain.replit.app/api/auth/wallet" \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "0x742d35Cc...", "walletType": "ethereum"}' \
  -c cookies.txt
```

**Create Right (requires authentication)**:
```bash
curl -X POST "https://your-domain.replit.app/api/rights" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "My Original Song",
    "type": "copyright", 
    "categoryId": 2,
    "description": "An original composition",
    "price": "1.50"
  }'
```

## Webhooks

### Setup

Configure webhook endpoints to receive real-time notifications:

```typescript
app.post('/webhook/dright', (req, res) => {
  const { event, data, timestamp } = req.body;
  
  // Verify webhook signature (recommended)
  const signature = req.headers['x-dright-signature'];
  if (!verifySignature(req.body, signature)) {
    return res.status(401).send('Invalid signature');
  }
  
  switch (event) {
    case 'right.verified':
      console.log(`Right "${data.right.title}" was verified`);
      break;
    case 'stake.revenue':
      console.log(`Revenue of ${data.amount} ETH distributed`);
      break;
  }
  
  res.status(200).json({ received: true });
});
```

### Events

| Event | Description | Data |
|-------|-------------|------|
| `right.verified` | Right approved by admin | `{ right: Right, verifiedBy: string }` |
| `right.rejected` | Right rejected by admin | `{ right: Right, reason: string }` |
| `stake.created` | New stake created | `{ stake: Stake, right: Right }` |
| `stake.revenue` | Revenue distributed | `{ stake: Stake, amount: string, source: string }` |
| `user.banned` | User account suspended | `{ user: User, reason: string }` |

## Best Practices

### Performance

1. **Use Pagination**: Always paginate large result sets
2. **Cache Responses**: Cache frequently accessed data client-side
3. **Batch Requests**: Group related API calls when possible
4. **Use Compression**: Enable gzip compression for requests

### Security

1. **Validate Input**: Always validate data before sending to API
2. **Handle Secrets**: Never expose API credentials in client-side code
3. **Rate Limiting**: Implement client-side rate limiting
4. **Error Handling**: Properly handle and log API errors

### Reliability

1. **Retry Logic**: Implement exponential backoff for failed requests
2. **Timeout Handling**: Set appropriate request timeouts
3. **Health Checks**: Monitor API availability
4. **Graceful Degradation**: Handle API unavailability gracefully

## Support

- **Documentation**: [API Reference](/api-reference)
- **Examples**: [GitHub Repository](https://github.com/dright/examples)
- **Community**: [Discord #developers](https://discord.gg/dright-dev)
- **Support**: developers@dright.io

## Changelog

### v1.2.0 (2025-07-24)
- Added comprehensive staking system with fixed platform terms
- Enhanced authentication with wallet support
- Improved error handling and response consistency
- Added admin verification workflow

### v1.1.0 (2025-07-20)
- Initial public API release
- Basic rights management endpoints
- Session-based authentication
- Rate limiting implementation

---

For the most up-to-date API reference with interactive examples, visit [/api-reference](/api-reference).