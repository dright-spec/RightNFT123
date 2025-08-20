// Simplified HashConnect integration for HashPack wallet interaction
import { HashConnect } from 'hashconnect';

export interface HashConnectMintResult {
  tokenId: string;
  transactionId: string;
  success: boolean;
}

export class HashConnectService {
  private hashconnect: HashConnect;
  private topic: string = '';
  private accountId: string = '';

  constructor() {
    this.hashconnect = new HashConnect();
  }

  async initHashConnect(): Promise<void> {
    // Initialize HashConnect for mainnet
    const appMetadata = {
      name: "Dright",
      description: "Digital Rights Marketplace on Hedera",
      icon: "https://dright.com/favicon.ico",
      url: "https://dright.com"
    };

    // Set up event listeners first
    this.hashconnect.foundExtensionEvent.on((data) => {
      console.log('HashPack extension found:', data);
    });

    this.hashconnect.pairingEvent.on((data) => {
      console.log('HashPack paired:', data);
      if (data.accountIds && data.accountIds.length > 0) {
        this.accountId = data.accountIds[0];
      }
    });

    // Initialize
    await this.hashconnect.init(appMetadata, "mainnet", false);
    
    this.topic = await this.hashconnect.connect();
    
    console.log('HashConnect initialized with topic:', this.topic);
  }

  async waitForPairing(): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Pairing timeout - please ensure HashPack is installed and try again'));
      }, 30000); // 30 second timeout

      this.hashconnect.pairingEvent.once((pairingData) => {
        clearTimeout(timeout);
        console.log('HashPack paired successfully:', pairingData);
        if (pairingData.accountIds && pairingData.accountIds.length > 0) {
          this.accountId = pairingData.accountIds[0];
          resolve(this.accountId);
        } else {
          reject(new Error('No account IDs received from HashPack'));
        }
      });
    });
  }

  async createNFTToken(params: {
    name: string;
    symbol: string;
    metadata: string;
    treasuryAccountId: string;
  }): Promise<HashConnectMintResult> {
    try {
      if (!this.accountId) {
        throw new Error('No connected account. Please pair with HashPack first.');
      }

      console.log('Creating NFT token via HashConnect:', params);

      // Create transaction object that HashConnect expects
      const transaction = {
        topic: this.topic,
        byteArray: null, // Will be populated by HashConnect
        metadata: {
          accountToSign: this.accountId,
          returnTransaction: false,
          hideNft: false
        },
        // Hedera transaction data
        transactionType: 'TokenCreateTransaction',
        tokenName: params.name,
        tokenSymbol: params.symbol,
        tokenType: 'NON_FUNGIBLE_UNIQUE',
        supplyType: 'FINITE',
        initialSupply: 0,
        maxSupply: 1,
        treasuryAccountId: this.accountId,
        tokenMemo: params.metadata,
        maxTransactionFee: 1000000000 // 10 HBAR in tinybars
      };

      console.log('Sending transaction to HashPack:', transaction);

      // Send transaction to HashPack
      const response = await this.hashconnect.sendTransaction(this.topic, transaction);

      console.log('HashConnect transaction response:', response);

      // Check if transaction was successful
      if (response && typeof response === 'object') {
        // Extract transaction ID and token ID from response
        const transactionId = response.transactionId || response.response?.transactionId || 'pending';
        const tokenId = response.tokenId || response.receipt?.tokenId || 'pending';
        
        return {
          tokenId: tokenId.toString(),
          transactionId: transactionId.toString(),
          success: true
        };
      } else {
        throw new Error('Invalid response from HashPack');
      }

    } catch (error) {
      console.error('HashConnect NFT creation error:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.accountId !== '';
  }

  getConnectedAccountId(): string {
    return this.accountId;
  }

  getTopic(): string {
    return this.topic;
  }
}