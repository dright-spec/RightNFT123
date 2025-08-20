# Dright - Hedera NFT Rights Marketplace

## Overview

Dright is a web3 marketplace for tokenizing and trading legal rights as NFTs on the Hedera network. It allows creators to mint, verify, and trade intellectual property rights (copyright, royalty, access, ownership, license) as Hedera Token Service (HTS) NFTs, with built-in revenue distribution. The platform aims to reduce legal costs, provide instant global market access, and transform illiquid assets into liquid markets.

## Recent Changes (August 2025)

✅ **Seamless HashPack Wallet Onboarding Completed** - Users can now connect HashPack via WalletConnect and are automatically registered in the database with immediate dashboard redirect. Full user registration and authentication flow working perfectly.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom design system, Radix UI primitives, shadcn/ui
- **Design Approach**: Professional investment-focused design, modern gradient hero banners, advanced filtering, context-aware onboarding with a Web3 mascot, multi-wallet modal with official branding.
- **Visuals**: High-quality Unsplash images for NFTs, optimized image URLs for various display contexts, micro-animations with custom keyframes and smooth transitions.

### Technical Implementations
- **Frontend**: TanStack Query for state, Wouter for routing, Vite for building.
- **Backend**: Node.js with Express, TypeScript (ESM), PostgreSQL with Drizzle ORM.
- **Authentication**: Multi-wallet authentication supporting both Ethereum (MetaMask) and Hedera (HashPack) wallets.
- **API**: Controller-based architecture, unified response format, rate limiting, validation, standardized error handling.
- **File Processing**: IPFS integration for metadata storage.
- **Verification Workflow**: Comprehensive system for rights approval before NFT minting. Includes YouTube auto-verification and admin manual review process for other content types. Secure file upload service with virus scanning, encryption, and integrity checking.
- **Right Types**: Supports copyright, royalty, access, ownership, and license rights.
- **Trading System**: Fixed price sales, auction system with time-based bidding and reserve prices, built-in dividend payment system, real-time activity feed.
- **Admin Panel**: Management of verification, document review, user management, analytics, and content moderation.

### System Design Choices
- **Blockchain Integration**: Dual-chain support for Ethereum and Hedera Hashgraph networks.
- **Wallet Integration**: Multi-wallet support via WalletConnect - HashPack for Hedera, MetaMask for Ethereum.
- **Decentralized Storage**: IPFS for NFT metadata and legal documents.
- **Currency**: Dual currency support - ETH for Ethereum, HBAR for Hedera transactions.
- **Revenue Distribution**: Smart contract functionality for automated distribution on both networks.
- **Scalability**: Database connection pooling, IPFS optimization, network-specific transaction rate limiting.

## External Dependencies

### Blockchain Services
- **Hedera SDK**: For core blockchain operations and native NFT support.
- **HashConnect**: For wallet connection and transaction signing.
- **IPFS**: For decentralized metadata and document storage.

### APIs and Services
- **YouTube Data API**: For YouTube content ownership verification.
- **Google OAuth**: For authentication related to YouTube integration.
- **PostgreSQL**: Primary database.

### Development Tools
- **Drizzle Kit**: For database migrations and schema management.
- **ESBuild**: For production build optimization.
- **Vite**: For development server and asset processing.