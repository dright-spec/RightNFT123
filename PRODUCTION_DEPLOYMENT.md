# Dright - Production Mainnet Deployment Guide

## 🚀 Production Configuration Changes

### Hedera Mainnet Integration
- **Network**: Switched from testnet to mainnet
- **Currency**: All pricing converted to HBAR
- **Real Transactions**: Live mainnet NFT minting

### Production Environment Variables Required
```bash
# Hedera Mainnet (REQUIRED)
HEDERA_ACCOUNT_ID=0.0.YOUR_MAINNET_ACCOUNT
HEDERA_PRIVATE_KEY=YOUR_MAINNET_PRIVATE_KEY_ED25519

# Database (REQUIRED)
DATABASE_URL=postgresql://user:pass@host:port/database

# Firebase for File Storage (OPTIONAL)
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_APP_ID=your_firebase_app_id
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id

# Session Secret (REQUIRED)
SESSION_SECRET=your_secure_random_string_32_chars_min
```

### Production Changes Made

#### 1. Hedera Mainnet Configuration
- ✅ Changed from `Client.forTestnet()` to `Client.forMainnet()`
- ✅ All NFT transactions now occur on live mainnet
- ✅ Real HBAR costs for token creation and minting

#### 2. Currency Standardization
- ✅ Default currency changed from ETH to HBAR
- ✅ All pricing interfaces use HBAR
- ✅ Bid calculations in HBAR
- ✅ Revenue distribution in HBAR

#### 3. Data Cleanup
- ✅ Removed all mock/test data initialization
- ✅ Clean database starts with no placeholder content
- ✅ Users must create real accounts and content
- ✅ No demo notifications or fake rights

#### 4. Production-Ready Features
- ✅ Real user registration and authentication
- ✅ Actual file uploads for patent documents
- ✅ Live admin verification workflow
- ✅ Genuine notification system
- ✅ Authentic marketplace transactions

## 💰 HBAR Pricing Considerations

### Mainnet Costs
- **Token Creation**: ~1-2 HBAR per NFT collection
- **NFT Minting**: ~0.1-0.2 HBAR per NFT
- **Transfers**: ~0.001 HBAR per transaction

### Recommended Pricing Strategy
- **Patent Rights**: 100-1000 HBAR
- **Copyright**: 50-500 HBAR  
- **License Rights**: 25-250 HBAR
- **Royalty Shares**: 10-100 HBAR

## 🔐 Security for Production

### Required Security Measures
1. **Environment Variables**: Store all secrets securely
2. **Database**: Use production PostgreSQL with SSL
3. **HTTPS**: Enable SSL/TLS for all connections
4. **Rate Limiting**: Configured for production traffic
5. **Error Handling**: Production-safe error messages

### Hedera Account Setup
1. Create mainnet Hedera account at portal.hedera.com
2. Fund account with sufficient HBAR (recommend 1000+ HBAR)
3. Generate ED25519 private key for production use
4. Configure account for token services

## 📋 Pre-Launch Checklist

### Technical Verification
- [ ] Hedera mainnet account funded and operational
- [ ] Database migrations completed
- [ ] All environment variables configured
- [ ] SSL certificates installed
- [ ] Domain DNS configured

### Functional Testing
- [ ] User registration workflow
- [ ] Patent submission process
- [ ] Admin verification system
- [ ] NFT minting on mainnet
- [ ] Marketplace transactions
- [ ] Notification delivery

### Go-Live Steps
1. Deploy code to production environment
2. Run database migrations
3. Verify Hedera mainnet connectivity
4. Test complete user workflow
5. Monitor error logs and performance
6. Launch with limited user access
7. Gradual rollout to full production

## 🎯 Production Launch Ready

The platform is now configured for live mainnet deployment with:
- Real Hedera blockchain integration
- HBAR-based economy
- Clean production data
- Authentic user workflows
- No mock or placeholder content

Ready for real users and genuine intellectual property rights tokenization.