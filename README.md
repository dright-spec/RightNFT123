# Dright - Hedera NFT Rights Marketplace

A comprehensive web3 marketplace for tokenizing and trading legal rights as NFTs on the Hedera network. Dright enables creators to mint, verify, and trade intellectual property rights with built-in revenue distribution capabilities.

## 🌟 Features

### Core Functionality
- **Rights Tokenization**: Convert copyright, royalty, access, ownership, and license rights into Hedera NFTs
- **Admin Verification**: Comprehensive verification system with document review and YouTube integration
- **User-Controlled Minting**: Users maintain full control over when to mint their approved rights
- **Multi-Wallet Support**: HashPack, Blade, WalletConnect, and MetaMask integration
- **Revenue Distribution**: Built-in dividend payment system for ongoing revenue streams

### Hedera Integration
- **Native HTS Support**: Uses Hedera Token Service for native NFT creation
- **Low Transaction Fees**: Predictable fees (approximately $0.0001 per transaction)
- **Fast Finality**: 3-5 second transaction confirmation
- **Energy Efficient**: Sustainable blockchain infrastructure
- **Enterprise Security**: Bank-grade security and compliance

### Rights Categories
- **Copyright**: Intellectual property rights to creative works
- **Royalty**: Ongoing revenue streams from existing assets
- **Access**: Exclusive access rights to content or services
- **Ownership**: Direct ownership stakes in assets
- **License**: Usage permissions and licensing rights

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Hedera account with HBAR funding

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/dright.git
   cd dright
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Configure Hedera credentials**
   ```bash
   export HEDERA_ACCOUNT_ID="0.0.xxxxx"
   export HEDERA_PRIVATE_KEY="your_private_key"
   export HEDERA_NETWORK="testnet"
   ```

5. **Set up database**
   ```bash
   npm run db:push
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Environment Variables

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/dright"

# Hedera Configuration
HEDERA_ACCOUNT_ID="0.0.xxxxx"
HEDERA_PRIVATE_KEY="your_hedera_private_key"
HEDERA_NETWORK="testnet" # or "mainnet"

# Optional: IPFS Enhancement
IPFS_API_KEY="your_ipfs_api_key"
IPFS_SECRET="your_ipfs_secret"

# Optional: YouTube Integration
YOUTUBE_API_KEY="your_youtube_api_key"
```

## 📋 Workflow

### Rights Submission & Verification
1. **User creates right** with documents and metadata
2. **YouTube auto-verification** for video content
3. **Admin review** for non-YouTube content with document access
4. **Approval notification** sent to user
5. **User-controlled minting** when ready
6. **Hedera NFT creation** with HTS
7. **Marketplace listing** for trading

### Trading System
- Fixed price sales with instant settlement
- Time-based auction system with automatic resolution
- Revenue distribution for dividend-paying rights
- Real-time activity tracking and notifications

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** with custom design system
- **Radix UI** components with shadcn/ui
- **TanStack Query** for server state management
- **Wouter** for client-side routing

### Backend
- **Node.js** with Express server
- **TypeScript** with ESM modules
- **PostgreSQL** with Drizzle ORM
- **JWT authentication** for admin access
- **IPFS integration** for metadata storage

### Blockchain
- **Hedera Hashgraph** mainnet integration
- **Hedera Token Service** for native NFTs
- **HashConnect** and wallet integrations
- **IPFS** for decentralized storage
- **HBAR** as primary currency

## 🔐 Security Features

- **Admin verification** required for all rights
- **Document authentication** with secure hash verification
- **Wallet connection encryption** with secure protocols
- **Rate limiting** and DDoS protection
- **Input validation** and sanitization
- **Session management** with secure cookies

## 📊 Admin Dashboard

- **Rights verification** with document viewing
- **User management** and activity monitoring
- **Platform analytics** and revenue tracking
- **Content moderation** tools
- **Financial metrics** and reporting

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Replit Deployment
The application is optimized for Replit deployment with automatic configuration detection and static file serving.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Hedera Documentation](https://docs.hedera.com)
- [HashPack Wallet](https://www.hashpack.app)
- [Blade Wallet](https://bladewallet.io)
- [IPFS Documentation](https://docs.ipfs.io)

## 💬 Support

- Create an issue for bug reports
- Join our Discord for community support
- Check the documentation for detailed guides

---

Built with ❤️ for the Hedera ecosystem