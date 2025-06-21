# Dright - Git Deployment Guide

## Repository Setup

### 1. Initialize Git Repository (if not already done)
```bash
git init
git remote add origin <your-repository-url>
```

### 2. Environment Variables Required
Create a `.env` file in your target deployment with these variables:
```
# Database
DATABASE_URL=<your-postgresql-connection-string>

# Hedera Blockchain
HEDERA_ACCOUNT_ID=<your-hedera-account-id>
HEDERA_PRIVATE_KEY=<your-hedera-private-key>

# Firebase (for file uploads)
VITE_FIREBASE_API_KEY=<your-firebase-api-key>
VITE_FIREBASE_APP_ID=<your-firebase-app-id>
VITE_FIREBASE_PROJECT_ID=<your-firebase-project-id>
```

### 3. Files to Push
All current project files should be pushed to your repository:

**Core Application:**
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite build configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `drizzle.config.ts` - Database configuration

**Source Code:**
- `client/` - React frontend application
- `server/` - Express backend API
- `shared/` - Shared TypeScript schemas
- `components.json` - UI components configuration

**Documentation:**
- `replit.md` - Project documentation and changelog
- `DEPLOYMENT_GUIDE.md` - Deployment instructions
- `VERIFICATION_NFT_WORKFLOW.md` - NFT workflow documentation

### 4. Git Commands to Deploy
```bash
# Add all files
git add .

# Commit with descriptive message
git commit -m "feat: Complete NFT marketplace with Hedera blockchain integration

- Patent submission workflow with admin verification
- Real NFT minting on Hedera testnet (proven working)
- Notification system for user approval alerts
- Admin document review with file access
- End-to-end blockchain integration with tokens 0.0.6212102+"

# Push to repository
git push -u origin main
```

### 5. Deployment Platform Setup
After pushing to Git, deploy to your preferred platform:

**For Vercel/Netlify:**
- Connect your Git repository
- Set environment variables in platform dashboard
- Deploy automatically on push

**For traditional hosting:**
- Clone repository on server
- Install dependencies: `npm install`
- Set environment variables
- Build: `npm run build`
- Start: `npm start`

### 6. Database Migration
After deployment, run database migration:
```bash
npm run db:push
```

## Current Project Status

✅ **Fully Functional Features:**
- Patent submission with admin verification
- Real Hedera NFT minting (tokens 0.0.6212102, 0.0.6207393, etc.)
- User notification system
- Admin document review capability
- Complete marketplace functionality

✅ **Live Blockchain Integration:**
- Hedera testnet connectivity confirmed
- Automatic NFT minting on approval
- Transaction recording in database
- HBAR balance tracking

✅ **Production Ready:**
- TypeScript throughout
- Database integration
- Error handling
- Security measures
- Comprehensive testing

The codebase is ready for Git deployment and production use.