# Dright Developer Guide

## Overview

Welcome to the Dright developer ecosystem! This guide provides comprehensive information for developers looking to integrate with our intellectual property rights marketplace, build applications on top of our platform, or contribute to the ecosystem.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Authentication](#authentication)  
3. [Core Concepts](#core-concepts)
4. [API Integration](#api-integration)
5. [SDKs and Libraries](#sdks-and-libraries)
6. [Webhooks](#webhooks)
7. [Best Practices](#best-practices)
8. [Use Cases](#use-cases)
9. [Rate Limits](#rate-limits)
10. [Support](#support)

## Getting Started

### Prerequisites

- Node.js 18+ or any HTTP client
- Basic understanding of REST APIs
- For wallet integration: Web3 wallet (MetaMask, Phantom, etc.)
- For testing: Access to our development environment

### Quick Start

1. **Install our TypeScript client library:**
```bash
npm install @dright/api-client
```

2. **Basic setup:**
```typescript
import DrightAPI from '@dright/api-client';

const api = new DrightAPI({
  baseURL: 'https://your-domain.replit.app/api',
  // Optional: provide authentication
  apiKey: 'your-api-key'
});
```

3. **Make your first call:**
```typescript
// Get available rights in the marketplace
const rights = await api.rights.getRights({
  page: 1,
  limit: 10,
  type: 'copyright'
});
console.log(`Found ${rights.meta.total} rights`);
```

## Authentication

Dright supports multiple authentication methods:

### 1. Wallet Authentication (Recommended)

Connect users through their Web3 wallets:

```typescript
// Frontend wallet connection
const connectWallet = async () => {
  if (window.ethereum) {
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });
    
    const walletAddress = accounts[0];
    
    // Authenticate with Dright
    const user = await api.auth.connectWallet(walletAddress, 'ethereum');
    return user;
  }
};
```

### 2. Traditional Email/Password

For applications that need traditional authentication:

```typescript
const login = async (email: string, password: string) => {
  try {
    const result = await api.auth.login(email, password);
    return result.user;
  } catch (error) {
    console.error('Login failed:', error.message);
  }
};
```

### 3. Session Management

Once authenticated, sessions are maintained via HTTP-only cookies:

```typescript
// Check current authentication status
const getCurrentUser = async () => {
  try {
    const user = await api.auth.getCurrentUser();
    return user;
  } catch (error) {
    // User not authenticated
    return null;
  }
};
```

## Core Concepts

### Rights

Rights represent tokenized intellectual property. Each right has:

- **Type**: copyright, royalty, access, ownership, license
- **Status**: pending, verified, rejected
- **Price**: Listed price in ETH
- **Creator**: Original rights holder
- **Metadata**: Title, description, tags, documents

### Staking

Staking allows rights holders to earn passive income through professional management:

- **Fixed Terms**: 75% user revenue share, 15% platform management fee
- **Duration**: Flexible staking periods (3-24 months)
- **Revenue Types**: Licensing, streaming royalties, sync deals
- **Transparency**: Full revenue reporting and distribution history

### Verification

All rights must be verified before trading:

- **Automatic**: YouTube content verification via API
- **Manual**: Admin review for other content types
- **Documents**: Ownership proofs, legal documentation
- **Status**: Real-time verification status updates

## API Integration

### Base Configuration

```typescript
const config = {
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://dright.replit.app/api'
    : 'http://localhost:5000/api',
  timeout: 30000,
  retries: 3
};
```

### Common Patterns

#### Pagination

All list endpoints support pagination:

```typescript
const fetchAllRights = async () => {
  let page = 1;
  let allRights = [];
  
  do {
    const response = await api.rights.getRights({ page, limit: 50 });
    allRights.push(...response.data);
    page++;
  } while (response.meta.hasMore);
  
  return allRights;
};
```

#### Error Handling

Implement robust error handling:

```typescript
const handleApiCall = async (apiCall: () => Promise<any>) => {
  try {
    return await apiCall();
  } catch (error) {
    switch (error.code) {
      case 'UNAUTHORIZED':
        // Redirect to login
        window.location.href = '/login';
        break;
      case 'RATE_LIMITED':
        // Implement backoff
        await new Promise(resolve => setTimeout(resolve, 60000));
        return handleApiCall(apiCall);
      case 'VALIDATION_ERROR':
        // Show user-friendly validation errors
        showErrorMessage(error.message);
        break;
      default:
        console.error('Unexpected error:', error);
    }
  }
};
```

#### Real-time Updates

For live data, implement polling or webhooks:

```typescript
class RealTimeRights {
  private intervalId: NodeJS.Timeout | null = null;
  
  startPolling(callback: (rights: Right[]) => void) {
    this.intervalId = setInterval(async () => {
      const rights = await api.rights.getRights({ 
        sortBy: 'updatedAt',
        sortOrder: 'desc' 
      });
      callback(rights.data);
    }, 30000); // Poll every 30 seconds
  }
  
  stopPolling() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
```

## SDKs and Libraries

### Official TypeScript/JavaScript SDK

```bash
npm install @dright/api-client
```

Features:
- Full TypeScript support
- Automatic error handling
- Built-in retry logic
- Request/response interceptors

### Python SDK

```bash
pip install dright-python
```

```python
from dright import DrightAPI

api = DrightAPI(base_url="https://dright.replit.app/api")

# Authenticate
user = api.auth.connect_wallet("0x742d35Cc...", "ethereum")

# Get rights
rights = api.rights.get_rights(page=1, limit=20)
print(f"Found {len(rights['data'])} rights")
```

### cURL Examples

For quick testing or non-JavaScript environments:

```bash
# Get rights
curl -X GET "https://dright.replit.app/api/rights?page=1&limit=5" \
  -H "Content-Type: application/json"

# Authenticate with wallet
curl -X POST "https://dright.replit.app/api/auth/wallet" \
  -H "Content-Type: application/json" \
  -d '{"walletAddress": "0x742d35Cc...", "walletType": "ethereum"}' \
  -c cookies.txt

# Create a right (requires authentication)
curl -X POST "https://dright.replit.app/api/rights" \
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

Set up webhooks to receive real-time notifications:

### Webhook Events

- `right.verified` - Right approved by admin
- `right.rejected` - Right rejected by admin  
- `stake.created` - New stake created
- `stake.revenue` - Revenue distribution occurred
- `user.banned` - User account suspended

### Setup

```typescript
// Configure webhook endpoint
const webhookHandler = (req, res) => {
  const { event, data } = req.body;
  
  switch (event) {
    case 'right.verified':
      console.log(`Right ${data.right.title} was verified`);
      // Notify user, update UI, etc.
      break;
    case 'stake.revenue':
      console.log(`Revenue of ${data.amount} ETH distributed`);
      // Update earnings display
      break;
  }
  
  res.status(200).json({ received: true });
};
```

### Webhook Security

Verify webhook signatures:

```typescript
import crypto from 'crypto';

const verifyWebhook = (payload, signature, secret) => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
};
```

## Best Practices

### Performance Optimization

1. **Caching**: Cache frequently accessed data:
```typescript
const cache = new Map();

const getCachedRights = async (cacheKey: string) => {
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  
  const rights = await api.rights.getRights();
  cache.set(cacheKey, rights);
  
  // Expire cache after 5 minutes
  setTimeout(() => cache.delete(cacheKey), 300000);
  
  return rights;
};
```

2. **Batch Operations**: Group related API calls:
```typescript
const batchRightOperations = async (rightIds: number[]) => {
  const promises = rightIds.map(id => api.rights.getRight(id));
  const results = await Promise.allSettled(promises);
  
  return results.map((result, index) => ({
    id: rightIds[index],
    data: result.status === 'fulfilled' ? result.value : null,
    error: result.status === 'rejected' ? result.reason : null
  }));
};
```

### Security

1. **Input Validation**: Always validate user inputs:
```typescript
const validateRightData = (data: any) => {
  const schema = {
    title: { required: true, minLength: 3, maxLength: 100 },
    price: { required: true, type: 'string', pattern: /^\d+\.?\d*$/ },
    type: { required: true, enum: ['copyright', 'royalty', 'access', 'ownership', 'license'] }
  };
  
  // Implement validation logic
  // Return validation errors or null if valid
};
```

2. **Rate Limiting**: Implement client-side rate limiting:
```typescript
class RateLimiter {
  private requests: number[] = [];
  private limit: number;
  private window: number;
  
  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.window = windowMs;
  }
  
  async acquire(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.window);
    
    if (this.requests.length >= this.limit) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.window - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return this.acquire();
    }
    
    this.requests.push(now);
  }
}
```

## Use Cases

### 1. Rights Management Platform

Build a platform for creators to manage their IP:

```typescript
class CreatorPlatform {
  async createRightFromUpload(file: File, metadata: any) {
    // Upload file to IPFS
    const fileHash = await this.uploadToIPFS(file);
    
    // Create right with file reference
    return api.rights.createRight({
      ...metadata,
      contentFileHash: fileHash,
      contentFileUrl: `https://ipfs.io/ipfs/${fileHash}`
    });
  }
  
  async getCreatorDashboard(creatorId: number) {
    const [rights, stakes, earnings] = await Promise.all([
      api.rights.getRights({ creatorId }),
      api.staking.getUserStakes(),
      api.users.getEarnings(creatorId)
    ]);
    
    return { rights, stakes, earnings };
  }
}
```

### 2. Investment Platform

Create a platform for rights investment:

```typescript
class InvestmentPlatform {
  async getInvestmentOpportunities() {
    const rights = await api.rights.getRights({
      verificationStatus: 'verified',
      paysDividends: true,
      sortBy: 'yield',
      sortOrder: 'desc'
    });
    
    // Calculate investment metrics
    return rights.data.map(right => ({
      ...right,
      estimatedYield: this.calculateYield(right),
      riskScore: this.assessRisk(right),
      liquidityScore: this.assessLiquidity(right)
    }));
  }
  
  async createInvestmentPortfolio(userId: number, investments: any[]) {
    const stakes = await Promise.all(
      investments.map(inv => 
        api.staking.createStake({
          rightId: inv.rightId,
          duration: inv.duration
        })
      )
    );
    
    return this.trackPortfolioPerformance(stakes);
  }
}
```

### 3. Marketplace Integration

Integrate rights trading into existing platforms:

```typescript
class MarketplaceIntegration {
  async syncRightsInventory() {
    const rights = await api.rights.getRights({ limit: 1000 });
    
    // Sync with your platform's inventory
    for (const right of rights.data) {
      await this.updateLocalInventory(right);
    }
  }
  
  async handlePurchase(rightId: number, buyerInfo: any) {
    try {
      // Process payment through your system
      const payment = await this.processPayment(buyerInfo);
      
      // Complete rights transfer
      const transfer = await api.rights.transfer({
        rightId,
        newOwnerId: buyerInfo.userId,
        transactionHash: payment.txHash
      });
      
      return transfer;
    } catch (error) {
      // Handle failed purchase
      await this.refundPayment(buyerInfo.paymentId);
      throw error;
    }
  }
}
```

## Rate Limits

Current rate limits per API key:

- **Public endpoints**: 200 requests/minute
- **Authenticated endpoints**: 500 requests/minute  
- **Admin endpoints**: 100 requests/minute
- **Upload endpoints**: 50 requests/minute

Rate limit headers in responses:
```
X-RateLimit-Limit: 200
X-RateLimit-Remaining: 195
X-RateLimit-Reset: 1641234567
```

Handle rate limits gracefully:

```typescript
const makeRequestWithRetry = async (apiCall: () => Promise<any>, maxRetries = 3) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (error.code === 'RATE_LIMITED' && attempt < maxRetries) {
        const retryAfter = parseInt(error.headers['retry-after'] || '60');
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        continue;
      }
      throw error;
    }
  }
};
```

## Support

### Developer Resources

- **API Reference**: [/api-reference](/api-reference)
- **Interactive Docs**: [/docs](/docs) 
- **GitHub Examples**: [github.com/dright/examples](https://github.com/dright/examples)
- **Discord Community**: [discord.gg/dright-dev](https://discord.gg/dright-dev)

### Getting Help

1. **Check Documentation**: Start with our API reference and guides
2. **Search Issues**: Check GitHub issues for similar problems
3. **Community Support**: Ask questions in our Discord #developers channel
4. **Direct Support**: Email developers@dright.io for technical support

### Reporting Issues

When reporting bugs, include:

- API endpoint and method
- Request payload (sanitize sensitive data)
- Response received vs expected
- Error codes and messages
- Your environment (Node.js version, browser, etc.)

### Feature Requests

We welcome feature requests! Please:

1. Check existing feature requests in GitHub issues
2. Describe your use case clearly
3. Explain the business value
4. Provide mockups or examples if helpful

## Contributing

Interested in contributing to Dright? Check out our:

- [Contribution Guidelines](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)  
- [Development Setup](DEVELOPMENT.md)

---

**Need help?** Join our developer community on Discord or email developers@dright.io