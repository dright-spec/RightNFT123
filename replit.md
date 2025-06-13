# Dright - Hedera NFT Rights Marketplace

## Overview

Dright is a comprehensive web3 marketplace for tokenizing and trading legal rights as NFTs on the Hedera blockchain. The platform enables creators to mint, verify, and trade intellectual property rights (copyright, royalty, access, ownership, license) as Hedera Token Service (HTS) NFTs with built-in revenue distribution capabilities.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with shadcn/ui
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite with custom configuration

### Backend Architecture
- **Runtime**: Node.js with Express server
- **Language**: TypeScript (ESM modules)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based admin authentication
- **File Processing**: IPFS integration for metadata storage

### Blockchain Integration
- **Blockchain**: Hedera Hashgraph (testnet/mainnet)
- **NFT Standard**: Hedera Token Service (HTS)
- **Wallet**: HashPack integration via HashConnect
- **Storage**: IPFS for NFT metadata and legal documents
- **Currency**: HBAR (Hedera's native cryptocurrency)

## Key Components

### Verification-Based NFT Minting
The platform implements a comprehensive verification workflow where NFTs are only minted for fully verified rights:
- **YouTube Auto-Verification**: Automatic verification for YouTube content ownership
- **Admin Review Process**: Manual verification for non-YouTube content
- **Automatic NFT Minting**: NFTs are minted automatically when rights are verified
- **Blockchain Recording**: All Hedera transaction data is recorded in the database

### Right Types and Categories
- **Copyright**: Intellectual property rights to creative works
- **Royalty**: Ongoing revenue streams from existing assets
- **Access**: Exclusive access rights to content or services
- **Ownership**: Direct ownership stakes in assets
- **License**: Usage permissions and licensing rights

### Trading System
- **Fixed Price Sales**: Direct purchase at set prices
- **Auction System**: Time-based bidding with automatic settlement
- **Revenue Distribution**: Built-in dividend payment system
- **Activity Feed**: Real-time trading activity and market statistics

### Admin Panel
- **Verification Management**: Review and approve/reject rights
- **User Management**: Monitor user activity and ban enforcement
- **Analytics Dashboard**: Platform statistics and revenue tracking
- **Content Moderation**: Tools for maintaining platform quality

## Data Flow

### Right Creation Flow
1. User creates right through frontend form
2. YouTube content auto-verified via YouTube API
3. Non-YouTube content marked as "pending"
4. Admin reviews pending rights
5. Upon verification, automatic NFT minting initiates
6. Hedera blockchain data recorded in database
7. Right becomes tradeable on marketplace

### Trading Flow
1. Verified rights listed on marketplace
2. Users browse and filter available rights
3. Purchase/bid transactions processed
4. Ownership transfer recorded on Hedera
5. Database updated with new ownership
6. Revenue distribution triggered if applicable

## External Dependencies

### Blockchain Services
- **Hedera SDK**: Core blockchain operations
- **HashConnect**: Wallet connection and transaction signing
- **IPFS**: Decentralized metadata and document storage

### APIs and Services
- **YouTube Data API**: Video ownership verification
- **Google OAuth**: Authentication for YouTube integration
- **PostgreSQL**: Primary data storage

### Development Tools
- **Drizzle Kit**: Database migrations and schema management
- **ESBuild**: Production build optimization
- **Vite**: Development server and asset processing

## Deployment Strategy

### Environment Configuration
- **Database**: PostgreSQL with connection pooling via Neon
- **Hedera**: Configurable testnet/mainnet with operator credentials
- **IPFS**: Optional authentication for enhanced service
- **YouTube**: API key for content verification

### Build Process
1. Frontend build with Vite (static assets to `dist/public`)
2. Backend build with ESBuild (server bundle to `dist/index.js`)
3. Database migrations applied via Drizzle
4. Environment variables validated on startup

### Scaling Considerations
- Database connection pooling for concurrent users
- IPFS service optimization for metadata storage
- Hedera transaction rate limiting and error handling
- Real-time updates via periodic data refreshing

## Changelog
- June 13, 2025: **PRODUCTION-READY DEPLOYMENT**: Implemented comprehensive production-level optimizations including enterprise-grade security (rate limiting, CORS, Helmet.js), database optimization with connection pooling, global error handling, health monitoring endpoints, and deployment-ready configuration. Application now fully optimized for Replit deployment with comprehensive security measures.
- June 13, 2025: Enhanced wallet detection system with comprehensive HashPack and Blade wallet support, including automatic extension detection, fallback connection methods, and user-friendly troubleshooting guide
- June 13, 2025: Implemented comprehensive micro-animation system with 12+ custom keyframes, smooth page transitions, staggered grid loading, and consistent 300ms duration animations across entire marketplace
- June 13, 2025: Initial setup with Hedera NFT marketplace foundation

## User Preferences

Preferred communication style: Simple, everyday language.