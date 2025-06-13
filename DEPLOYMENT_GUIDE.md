# Dright - Hedera NFT Rights Marketplace Deployment Guide

## Overview
Dright is a comprehensive web3 marketplace for tokenizing and trading legal rights as NFTs on the Hedera blockchain. This platform provides a secure, legally compliant way to mint, trade, and manage intellectual property rights.

## Architecture

### Blockchain Integration
- **Blockchain**: Hedera Hashgraph (Testnet/Mainnet)
- **NFT Standard**: Hedera Token Service (HTS)
- **Wallet**: HashPack integration
- **Storage**: IPFS for metadata and legal documents
- **Currency**: HBAR (Hedera's native cryptocurrency)

### Key Features
1. **NFT Minting**: Rights are minted as NFTs on Hedera with metadata stored on IPFS
2. **Legal Compliance**: Clear legal disclaimers and ownership verification
3. **Revenue Streams**: Built-in dividend distribution system
4. **Marketplace**: Full trading functionality with auctions and fixed-price sales
5. **Real-time Activity**: Live trading activity feed with market statistics

## Deployment Configuration

### Environment Variables Required

#### Database
- `DATABASE_URL`: PostgreSQL connection string
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`: PostgreSQL credentials

#### Hedera Blockchain
- `VITE_HEDERA_OPERATOR_ID`: Hedera account ID for platform operations
- `VITE_HEDERA_OPERATOR_KEY`: Private key for platform operations
- `VITE_HEDERA_NETWORK`: Network (testnet/mainnet)

#### IPFS Storage
- `VITE_IPFS_AUTH`: Base64 encoded IPFS service credentials (optional)

#### YouTube API (for content verification)
- `YOUTUBE_API_KEY`: YouTube Data API key for video verification

### Database Schema
The platform uses PostgreSQL with the following key tables:
- `users`: User accounts and wallet connections
- `rights`: Rights/NFTs with Hedera blockchain data
- `categories`: Rights categorization
- `bids`: Auction bidding system
- `transactions`: Trading history
- `favorites`: User favorites
- `follows`: User following system

### Hedera NFT Fields
Each right is mapped to a Hedera NFT with these blockchain fields:
- `hederaTokenId`: Hedera token ID (e.g., "0.0.123456")
- `hederaSerialNumber`: NFT serial number within the token
- `hederaTransactionId`: Mint transaction hash
- `hederaMetadataUri`: IPFS URI containing NFT metadata
- `hederaAccountId`: Current NFT holder account
- `hederaNetwork`: Network (testnet/mainnet)

## NFT-to-Rights Mapping

### Unique Identification System
1. **Platform ID**: Internal database ID for the right
2. **Hedera Token ID**: Blockchain token identifier
3. **Serial Number**: Unique NFT instance within the token
4. **Transaction Hash**: Immutable proof of minting

### Metadata Structure
Each NFT contains structured metadata on IPFS:
```json
{
  "title": "Stream Rights to Track X",
  "description": "Comprehensive description of the right",
  "type": "copyright|royalty|access|ownership|license",
  "dividends": true,
  "payout_address": "0.0.xxxx",
  "creator": "0.0.yyyy",
  "created_at": "2025-01-01T00:00:00Z",
  "doc_uri": "ipfs://...hash" // Legal documents
}
```

### Legal Framework
- Rights are tokenized as legal ownership instruments, not securities
- Platform facilitates legal ownership transfer
- Original rights holders control income streams directly
- Platform serves as marketplace facilitator only

## Deployment Steps

### 1. Database Setup
```bash
npm run db:push
```

### 2. Environment Configuration
Set all required environment variables in your deployment platform.

### 3. Hedera Network Setup
- Configure testnet for development
- Configure mainnet for production
- Ensure operator account has sufficient HBAR for gas fees

### 4. IPFS Integration
- Configure IPFS service (Pinata, Infura, or Web3.Storage)
- Set up authentication credentials

### 5. Security Considerations
- All wallet connections use HashPack for security
- Private keys never stored on platform
- NFT ownership verified on-chain
- Legal documents stored on IPFS with content addressing

## Wallet Integration

### HashPack Wallet
- Primary wallet for Hedera ecosystem
- Users connect via browser extension
- Supports NFT minting, transfers, and trading
- Network switching between testnet/mainnet

### Wallet Features
- Account balance display (HBAR)
- NFT collection viewing
- Transaction history
- Network status indicators

## Trading Functionality

### NFT Marketplace
- Fixed-price listings in HBAR
- Auction system with bidding
- Automatic ownership transfer via Hedera
- Real-time market activity feed

### Revenue Distribution
- Dividend payments configurable per NFT
- Direct HBAR transfers to NFT holders
- Automated or manual distribution options
- Transparent payment tracking

## Legal Compliance

### Platform Disclaimers
- Clear legal notices on all pages
- Rights are legal ownership tools, not investments
- Platform is marketplace facilitator only
- Users maintain direct control of income streams

### Content Verification
- YouTube API integration for video rights verification
- Legal document upload and IPFS storage
- Ownership verification workflow
- Trust scoring system

## Monitoring and Analytics

### Market Statistics
- 24-hour trading volume
- Active listings count
- Average sale prices
- Market capitalization

### Real-time Activity
- Live trading activity feed
- Transaction animations
- High-value transaction highlighting
- Market momentum indicators

## Production Readiness Checklist

- [ ] Database schema deployed
- [ ] Environment variables configured
- [ ] Hedera network configured (mainnet for production)
- [ ] IPFS service connected
- [ ] HashPack wallet integration tested
- [ ] Legal disclaimers reviewed
- [ ] Trading functionality verified
- [ ] NFT minting process tested
- [ ] Revenue distribution configured
- [ ] Security audit completed

## Support and Maintenance

### Regular Tasks
- Monitor HBAR gas fees
- Update IPFS pinning
- Database maintenance
- Security updates
- Legal compliance reviews

### Scaling Considerations
- IPFS gateway performance
- Database query optimization
- Hedera consensus node selection
- CDN for static assets

## Contact Information
For deployment support or technical questions, refer to:
- Hedera documentation: https://docs.hedera.com
- HashPack wallet: https://www.hashpack.app
- IPFS documentation: https://docs.ipfs.io

---
**Important**: This platform deals with legal rights and financial transactions. Ensure all legal and regulatory requirements are met before production deployment.