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
- **Blockchain**: Ethereum (mainnet/sepolia testnet)
- **NFT Standard**: ERC-721 with ERC-2981 royalty support
- **Wallet**: MetaMask integration with Web3 provider
- **Storage**: IPFS for NFT metadata and legal documents
- **Currency**: ETH (Ethereum's native cryptocurrency)
- **Smart Contracts**: Custom rights tokenization with automated revenue distribution

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
- June 17, 2025: **CONTEXT-AWARE ONBOARDING WITH WEB3 MASCOT**: Implemented comprehensive onboarding system with interactive tooltips guided by animated web3 mascot. Features welcome modal for new users with 3-slide introduction, context-aware tooltips that highlight specific UI elements, progress tracking with persistent localStorage state, separate onboarding flows for marketplace and create-right pages, and help tour button for returning users. Mascot includes multiple expressions (excited, explaining, celebrating, thinking) with animated particles and floating elements. System automatically detects new users and provides guided tours without being intrusive.
- June 17, 2025: **NAVIGATION STREAMLINING**: Removed redundant auctions page since marketplace handles all auction functionality through tabs. Updated all navigation references to point to marketplace with proper tab context, eliminating user confusion and maintaining clean architecture.
- June 17, 2025: **OPENSEA-STYLE MARKETPLACE REDESIGN**: Complete marketplace overhaul with professional investment-focused design. Implemented modern gradient hero banners, advanced filtering system based on business model (yield potential, risk profile, investment budget), four comprehensive tabs (Explore, Live Auctions, Buy Now, Activity), enhanced sorting options prioritizing investment decisions, revenue model filters (dividends, royalties, value appreciation), and integrated auction handling with reserve prices. Marketplace now emphasizes investment opportunities with language tailored for informed investment decisions rather than simple browsing.
- June 17, 2025: **DESIGN PREFERENCE ESTABLISHED**: User confirmed preference for original home page design. Removed A/B testing functionality and alternative design variants (minimalist and beautiful). Maintaining single, comprehensive original design focused on detailed feature presentation and marketplace showcase.
- June 15, 2025: **SECURE YOUTUBE OWNERSHIP VERIFICATION**: Implemented robust channel ownership verification system requiring users to prove they own YouTube channels before tokenizing videos. Uses secure verification codes that must be added to video descriptions or titles (admin-only editable fields), preventing impersonation through comments. Includes direct YouTube Studio links, copy-to-clipboard functionality, and clear security explanations. Ensures only legitimate channel owners can create rights NFTs.
- June 15, 2025: **STANDARDIZED CONTENT SOURCE SELECTION**: Implemented multiple choice content source selection system with 9 standardized categories: YouTube Video (auto-verified), Music Track, Patent, Real Estate, Artwork, Software, Brand, Book, and Other. Each option includes appropriate icons, descriptions, and automatic right type mapping for better data consistency and user experience.
- June 15, 2025: **ETHEREUM BLOCKCHAIN MIGRATION**: Complete platform migration from Hedera to Ethereum blockchain. Created comprehensive ERC-721 smart contract (DrightRightsNFT.sol) with automated revenue distribution, marketplace functionality, auction system, and royalty support. Implemented MetaMask wallet integration, IPFS metadata storage, and Ethereum-based NFT minting. Updated business model messaging to focus on legitimate benefits: 90% reduced legal costs, instant global market access, and transformation of illiquid assets into liquid markets. Enhanced Create Right page with prominent YouTube video copyright option for streamlined user flow.
- June 15, 2025: **AUTOSCALE DEPLOYMENT OPTIMIZATION**: Completely resolved Autoscale deployment blank page issue by simplifying complex deployment detection logic into single, reliable method. Removed conflicting middleware systems and streamlined static file serving for production mode. Enhanced domain detection for .replit.app domains with automatic production mode triggering. Added comprehensive deployment health check endpoint for monitoring. Server correctly binds to 0.0.0.0 with proper PORT environment variable usage as required for Autoscale.
- June 15, 2025: **SECURITY UPDATE & DEPLOYMENT FIX**: Updated ipfs-http-client from 60.0.1 to 39.0.2 for security compliance. Created IPFS compatibility wrapper to handle API changes between versions, ensuring seamless IPFS functionality with fallback mechanisms. Fixed deployment binding issue by updating server to use standard Express app.listen(port, '0.0.0.0') format instead of server.listen() object configuration, resolving "connection refused" errors in deployment environment.
- June 14, 2025: **DEPLOYMENT ISSUE RESOLUTION**: Fixed critical deployment blank page issue where website worked in preview but failed in browser deployment. Root cause was environment detection failure - deployed applications weren't triggering production mode, so Vite dev HTML was served instead of static files. Implemented browser detection middleware that intercepts .replit.app domain requests and forces static file serving. Deployment now correctly serves production landing page with marketplace navigation and API health checks.
- June 14, 2025: **OPENSEA-STYLE AUCTION SYSTEM**: Implemented comprehensive multi-video pricing interface with OpenSea-style auction functionality. Users can select multiple YouTube videos and set individual pricing for each NFT with either fixed prices or time-based auctions. Features bulk pricing controls, auction duration settings (1 hour to 7 days), reserve prices, starting bids, and royalty configuration. Switched to royalty-based revenue model with free NFT minting and fees collected on future sales/transfers only.
- June 14, 2025: **STREAMLINED YOUTUBE CHANNEL PICKER**: Completely transformed YouTube verification with beautiful channel picker interface. Users connect their YouTube account to browse authentic videos with rich preview cards, search functionality, and multiple video selection with checkboxes. Features compact design for easy selection, smooth animations, and gradient designs. Eliminates manual verification steps - users simply connect YouTube, browse their videos, select multiple videos for NFT creation, and proceed with instant verification.
- June 14, 2025: **SECURE YOUTUBE VERIFICATION SYSTEM**: Implemented comprehensive two-step YouTube verification requiring authentic Google OAuth authentication. Features video thumbnail previews, secure ownership verification, anti-tampering measures, and fluid workflow integration from first step of right creation. System ensures only legitimate video owners can complete verification, maintaining platform trust and integrity.
- June 13, 2025: **PRODUCTION-READY DEPLOYMENT**: Implemented comprehensive production-level optimizations including enterprise-grade security (rate limiting, CORS, Helmet.js), database optimization with connection pooling, global error handling, health monitoring endpoints, and deployment-ready configuration. Application now fully optimized for Replit deployment with comprehensive security measures.
- June 13, 2025: Enhanced wallet detection system with comprehensive HashPack and Blade wallet support, including automatic extension detection, fallback connection methods, and user-friendly troubleshooting guide
- June 13, 2025: Implemented comprehensive micro-animation system with 12+ custom keyframes, smooth page transitions, staggered grid loading, and consistent 300ms duration animations across entire marketplace
- June 13, 2025: Initial setup with Hedera NFT marketplace foundation

## User Preferences

Preferred communication style: Simple, everyday language.