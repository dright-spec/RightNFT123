# Dright - Deployment Guide

## Production Readiness Checklist

### ✅ Security Implementation
- **Rate Limiting**: API endpoints protected with intelligent rate limiting
- **CORS Configuration**: Secure cross-origin policy for Replit domains
- **Security Headers**: Comprehensive Helmet.js protection
- **Input Validation**: Zod schema validation on all endpoints
- **SQL Injection Prevention**: Drizzle ORM parameterized queries

### ✅ Database Optimization
- **Connection Pooling**: Optimized for concurrent users
- **Query Optimization**: Efficient Drizzle ORM queries
- **Index Strategy**: Proper indexing for performance
- **Error Handling**: Comprehensive database error recovery

### ✅ Error Handling & Monitoring
- **Global Error Handler**: Production-grade error management
- **Health Checks**: `/health` and `/api/health` endpoints
- **Logging**: Structured error logging with timestamps
- **Graceful Degradation**: Fallback mechanisms for service failures

### ✅ Performance Optimization
- **Asset Bundling**: Optimized Vite build configuration
- **Compression**: Gzip/Brotli compression enabled
- **Caching Headers**: Appropriate cache control
- **Bundle Splitting**: Code splitting for faster load times

### ✅ Hedera Integration
- **Wallet Detection**: Comprehensive HashPack and Blade support
- **Transaction Handling**: Robust error recovery and retry logic
- **Network Configuration**: Testnet/Mainnet switching capability
- **IPFS Integration**: Decentralized metadata storage

## Environment Variables Required

```bash
# Database
DATABASE_URL=postgresql://username:password@host:port/database

# Hedera Configuration
HEDERA_NETWORK=testnet # or mainnet
HEDERA_OPERATOR_ID=0.0.xxxxx
HEDERA_OPERATOR_KEY=your_private_key

# YouTube API (for content verification)
YOUTUBE_API_KEY=your_youtube_api_key

# Google OAuth (for YouTube integration)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# IPFS (optional but recommended)
IPFS_PROJECT_ID=your_infura_project_id
IPFS_PROJECT_SECRET=your_infura_secret
```

## Deployment Steps

### 1. Pre-Deployment Verification
```bash
# Check all dependencies are installed
npm install

# Verify database connection
npm run db:push

# Run production build test
npm run build

# Test health endpoints
curl http://localhost:5000/health
curl http://localhost:5000/api/health
```

### 2. Deploy to Replit
1. Click the **Deploy** button in Replit
2. Configure environment variables in Secrets
3. The application will automatically build and deploy
4. Verify deployment at your `.replit.app` domain

### 3. Post-Deployment Testing
- [ ] Marketplace loads correctly
- [ ] Wallet connection works (HashPack/Blade)
- [ ] Right creation and NFT minting functional
- [ ] Admin panel accessible
- [ ] YouTube verification working
- [ ] Database queries performing well

## Performance Monitoring

The application includes built-in monitoring:
- **Response Time Logging**: All API endpoints timed
- **Error Rate Tracking**: Comprehensive error logging
- **Database Performance**: Query execution monitoring
- **Security Events**: Rate limiting and blocked requests

## Security Features

### Rate Limiting
- General API: 100 requests per 15 minutes
- Authentication: 5 attempts per 15 minutes  
- Admin endpoints: 30 requests per 15 minutes

### CORS Policy
- Replit domains automatically allowed
- Custom domain support
- Secure credential handling

### Input Validation
- All form inputs validated with Zod schemas
- SQL injection prevention via parameterized queries
- XSS protection through output encoding

## Scaling Considerations

### Database Scaling
- Connection pooling configured for high concurrency
- Query optimization with proper indexing
- Read replica support ready for implementation

### Application Scaling
- Stateless design enables horizontal scaling
- CDN-ready static asset configuration
- Microservice architecture preparation

## Troubleshooting

### Common Issues
1. **Wallet Connection Fails**: Check browser extension installation
2. **Database Timeout**: Verify connection string and network access
3. **IPFS Upload Errors**: Confirm IPFS credentials in environment
4. **YouTube Verification Issues**: Check API key permissions

### Debug Endpoints
- `GET /health` - Application health status
- `GET /api/health` - Service dependencies status
- Check browser console for wallet diagnostics

## Support

For deployment assistance:
1. Check application logs in Replit console
2. Verify all environment variables are set
3. Test individual service components
4. Contact Replit support for platform-specific issues