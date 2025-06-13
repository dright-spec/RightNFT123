import {
  Client,
  AccountId,
  PrivateKey,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  TokenNftInfoQuery,
  TransferTransaction,
  Hbar,
  TokenAssociateTransaction,
  AccountBalanceQuery,
  TransactionReceipt,
  Status
} from '@hashgraph/sdk';
import { HashConnect, HashConnectTypes, MessageTypes } from '@hashgraph/hashconnect';
import { create } from 'ipfs-http-client';

// Hedera network configuration
const HEDERA_NETWORK = process.env.NODE_ENV === 'production' ? 'mainnet' : 'testnet';
const OPERATOR_ID = process.env.VITE_HEDERA_OPERATOR_ID;
const OPERATOR_KEY = process.env.VITE_HEDERA_OPERATOR_KEY;

// IPFS configuration
const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';
const ipfs = create({ 
  host: 'ipfs.infura.io', 
  port: 5001, 
  protocol: 'https',
  headers: {
    authorization: process.env.VITE_IPFS_AUTH ? `Basic ${process.env.VITE_IPFS_AUTH}` : undefined
  }
});

interface HederaWalletStatus {
  isConnected: boolean;
  accountId: string | null;
  network: string;
}

interface RightMetadata {
  title: string;
  description: string;
  type: 'copyright' | 'royalty' | 'access' | 'ownership' | 'license';
  dividends: boolean;
  payout_address: string;
  doc_uri?: string;
  image_uri?: string;
  creator: string;
  created_at: string;
}

class HederaService {
  private client: Client | null = null;
  private hashConnect: HashConnect | null = null;
  private walletStatus: HederaWalletStatus = {
    isConnected: false,
    accountId: null,
    network: HEDERA_NETWORK
  };

  constructor() {
    this.initializeClient();
  }

  private initializeClient() {
    try {
      if (HEDERA_NETWORK === 'testnet') {
        this.client = Client.forTestnet();
      } else {
        this.client = Client.forMainnet();
      }

      // Set operator if available (for backend operations)
      if (OPERATOR_ID && OPERATOR_KEY) {
        this.client.setOperator(AccountId.fromString(OPERATOR_ID), PrivateKey.fromString(OPERATOR_KEY));
      }
    } catch (error) {
      console.error('Failed to initialize Hedera client:', error);
    }
  }

  // HashConnect wallet integration
  async initializeHashConnect(): Promise<void> {
    try {
      this.hashConnect = new HashConnect();
      
      const appMetadata: HashConnectTypes.AppMetadata = {
        name: "Dright - Rights Marketplace",
        description: "Tokenize and trade legal rights as NFTs",
        icon: "https://dright.replit.app/favicon.ico",
        url: window.location.origin
      };

      await this.hashConnect.init(appMetadata, "testnet");
      
      // Listen for pairing events
      this.hashConnect.pairingEvent.on((pairingData) => {
        console.log('Wallet paired:', pairingData);
        if (pairingData.accountIds && pairingData.accountIds.length > 0) {
          this.walletStatus = {
            isConnected: true,
            accountId: pairingData.accountIds[0],
            network: pairingData.network || HEDERA_NETWORK
          };
          localStorage.setItem('hedera_wallet', JSON.stringify(this.walletStatus));
        }
      });

      this.hashConnect.connectionStatusChangeEvent.on((status) => {
        console.log('Connection status changed:', status);
      });

    } catch (error) {
      console.error('Failed to initialize HashConnect:', error);
      throw error;
    }
  }

  async connectWallet(): Promise<string> {
    if (!this.hashConnect) {
      await this.initializeHashConnect();
    }

    try {
      // Check for existing connection
      const savedWallet = localStorage.getItem('hedera_wallet');
      if (savedWallet) {
        const walletData = JSON.parse(savedWallet);
        if (walletData.isConnected && walletData.accountId) {
          this.walletStatus = walletData;
          return walletData.accountId;
        }
      }

      // Request new connection
      await this.hashConnect!.connectToLocalWallet();
      
      // Wait for pairing to complete
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Connection timeout')), 30000);
        
        this.hashConnect!.pairingEvent.once((pairingData) => {
          clearTimeout(timeout);
          resolve(pairingData);
        });
      });

      if (!this.walletStatus.accountId) {
        throw new Error('Failed to connect wallet');
      }

      return this.walletStatus.accountId;
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  }

  disconnectWallet(): void {
    if (this.hashConnect) {
      this.hashConnect.disconnect();
    }
    
    this.walletStatus = {
      isConnected: false,
      accountId: null,
      network: HEDERA_NETWORK
    };
    
    localStorage.removeItem('hedera_wallet');
  }

  getWalletStatus(): HederaWalletStatus {
    const savedWallet = localStorage.getItem('hedera_wallet');
    if (savedWallet) {
      this.walletStatus = JSON.parse(savedWallet);
    }
    return this.walletStatus;
  }

  // Upload file to IPFS
  async uploadToIPFS(file: File): Promise<string> {
    try {
      const result = await ipfs.add(file);
      return result.cid.toString();
    } catch (error) {
      console.error('IPFS upload failed:', error);
      throw new Error('Failed to upload file to IPFS');
    }
  }

  // Upload metadata to IPFS
  async uploadMetadataToIPFS(metadata: RightMetadata): Promise<string> {
    try {
      const result = await ipfs.add(JSON.stringify(metadata, null, 2));
      return result.cid.toString();
    } catch (error) {
      console.error('Metadata upload failed:', error);
      throw new Error('Failed to upload metadata to IPFS');
    }
  }

  // Create NFT collection (only needs to be done once)
  async createNFTCollection(name: string, symbol: string): Promise<string> {
    if (!this.client || !this.walletStatus.isConnected) {
      throw new Error('Client not initialized or wallet not connected');
    }

    try {
      const transaction = new TokenCreateTransaction()
        .setTokenName(name)
        .setTokenSymbol(symbol)
        .setTokenType(TokenType.NonFungibleUnique)
        .setSupplyType(TokenSupplyType.Infinite)
        .setInitialSupply(0)
        .setTreasuryAccountId(AccountId.fromString(this.walletStatus.accountId!))
        .setSupplyKey(PrivateKey.fromString(OPERATOR_KEY!))
        .setAdminKey(PrivateKey.fromString(OPERATOR_KEY!))
        .setMaxTransactionFee(new Hbar(100))
        .freezeWith(this.client);

      // Sign and execute via HashConnect
      const response = await this.hashConnect!.sendTransaction(
        this.walletStatus.accountId!,
        transaction
      );

      if (response.success) {
        const receipt = TransactionReceipt.fromBytes(response.receipt as Uint8Array);
        return receipt.tokenId!.toString();
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Failed to create NFT collection:', error);
      throw error;
    }
  }

  // Mint NFT for a right
  async mintRightNFT(
    tokenId: string,
    metadata: RightMetadata,
    legalDocument?: File
  ): Promise<{ transactionId: string; serialNumber: number; metadataUri: string }> {
    if (!this.client || !this.walletStatus.isConnected) {
      throw new Error('Client not initialized or wallet not connected');
    }

    try {
      // Upload legal document to IPFS if provided
      if (legalDocument) {
        const docCid = await this.uploadToIPFS(legalDocument);
        metadata.doc_uri = `${IPFS_GATEWAY}${docCid}`;
      }

      // Upload metadata to IPFS
      const metadataCid = await this.uploadMetadataToIPFS(metadata);
      const metadataUri = `${IPFS_GATEWAY}${metadataCid}`;

      // Create mint transaction
      const mintTransaction = new TokenMintTransaction()
        .setTokenId(tokenId)
        .addMetadata(Buffer.from(metadataUri))
        .setMaxTransactionFee(new Hbar(20))
        .freezeWith(this.client);

      // Sign and execute via HashConnect
      const response = await this.hashConnect!.sendTransaction(
        this.walletStatus.accountId!,
        mintTransaction
      );

      if (response.success) {
        const receipt = TransactionReceipt.fromBytes(response.receipt as Uint8Array);
        
        if (receipt.status !== Status.Success) {
          throw new Error(`Transaction failed with status: ${receipt.status}`);
        }

        return {
          transactionId: response.transactionId,
          serialNumber: receipt.serials[0].toNumber(),
          metadataUri
        };
      } else {
        throw new Error('Mint transaction failed');
      }
    } catch (error) {
      console.error('Failed to mint NFT:', error);
      throw error;
    }
  }

  // Transfer NFT
  async transferNFT(
    tokenId: string,
    serialNumber: number,
    toAccountId: string,
    price?: number
  ): Promise<string> {
    if (!this.client || !this.walletStatus.isConnected) {
      throw new Error('Client not initialized or wallet not connected');
    }

    try {
      let transaction = new TransferTransaction()
        .addNftTransfer(tokenId, serialNumber, AccountId.fromString(this.walletStatus.accountId!), AccountId.fromString(toAccountId));

      // Add HBAR payment if price is specified
      if (price) {
        transaction = transaction.addHbarTransfer(AccountId.fromString(toAccountId), new Hbar(-price))
          .addHbarTransfer(AccountId.fromString(this.walletStatus.accountId!), new Hbar(price));
      }

      transaction = transaction.setMaxTransactionFee(new Hbar(20)).freezeWith(this.client);

      // Sign and execute via HashConnect
      const response = await this.hashConnect!.sendTransaction(
        this.walletStatus.accountId!,
        transaction
      );

      if (response.success) {
        return response.transactionId;
      } else {
        throw new Error('Transfer failed');
      }
    } catch (error) {
      console.error('Failed to transfer NFT:', error);
      throw error;
    }
  }

  // Get NFT info
  async getNFTInfo(tokenId: string, serialNumber: number): Promise<any> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    try {
      const nftInfo = await new TokenNftInfoQuery()
        .setNftId(`${tokenId}:${serialNumber}`)
        .execute(this.client);

      return {
        tokenId,
        serialNumber,
        accountId: nftInfo.accountId?.toString(),
        metadata: nftInfo.metadata ? Buffer.from(nftInfo.metadata).toString() : null,
        creationTime: nftInfo.creationTime
      };
    } catch (error) {
      console.error('Failed to get NFT info:', error);
      throw error;
    }
  }

  // Get account balance
  async getAccountBalance(accountId?: string): Promise<{ hbars: string; tokens: any[] }> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }

    const targetAccountId = accountId || this.walletStatus.accountId;
    if (!targetAccountId) {
      throw new Error('No account ID specified');
    }

    try {
      const balance = await new AccountBalanceQuery()
        .setAccountId(AccountId.fromString(targetAccountId))
        .execute(this.client);

      return {
        hbars: balance.hbars.toString(),
        tokens: Array.from(balance.tokens.entries()).map(([tokenId, amount]) => ({
          tokenId: tokenId.toString(),
          amount: amount.toString()
        }))
      };
    } catch (error) {
      console.error('Failed to get account balance:', error);
      throw error;
    }
  }

  // Associate token with account (required before receiving NFTs)
  async associateToken(tokenId: string): Promise<string> {
    if (!this.client || !this.walletStatus.isConnected) {
      throw new Error('Client not initialized or wallet not connected');
    }

    try {
      const transaction = new TokenAssociateTransaction()
        .setAccountId(AccountId.fromString(this.walletStatus.accountId!))
        .setTokenIds([tokenId])
        .setMaxTransactionFee(new Hbar(20))
        .freezeWith(this.client);

      const response = await this.hashConnect!.sendTransaction(
        this.walletStatus.accountId!,
        transaction
      );

      if (response.success) {
        return response.transactionId;
      } else {
        throw new Error('Token association failed');
      }
    } catch (error) {
      console.error('Failed to associate token:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const hederaService = new HederaService();

// Export types and utilities
export type { HederaWalletStatus, RightMetadata };
export { HEDERA_NETWORK, IPFS_GATEWAY };

// Utility functions
export function formatAccountId(accountId: string): string {
  return accountId;
}

export function formatTokenId(tokenId: string, serialNumber?: number): string {
  return serialNumber ? `${tokenId}:${serialNumber}` : tokenId;
}

export function getHederaExplorerUrl(transactionId: string): string {
  const baseUrl = HEDERA_NETWORK === 'mainnet' 
    ? 'https://hashscan.io/mainnet' 
    : 'https://hashscan.io/testnet';
  return `${baseUrl}/transaction/${transactionId}`;
}