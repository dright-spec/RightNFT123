// HashConnect integration for proper HashPack wallet interaction
import { HashConnect } from 'hashconnect';
import { AccountId, TokenCreateTransaction, TokenType, TokenSupplyType, Hbar } from '@hashgraph/sdk';

export interface HashConnectMintResult {
  tokenId: string;
  transactionId: string;
  success: boolean;
}

export class HashConnectService {
  private hashconnect: HashConnect;
  private topic: string = '';
  private pairingKey: string = '';

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

    // Initialize with mainnet
    await this.hashconnect.init(appMetadata, "mainnet");
    
    // Generate pairing key
    this.pairingKey = this.hashconnect.generatePairingKey();
    
    // Connect to extension if available
    this.topic = await this.hashconnect.connect();
    
    console.log('HashConnect initialized:', {
      topic: this.topic,
      pairingKey: this.pairingKey
    });
  }

  async waitForPairing(): Promise<void> {
    return new Promise((resolve) => {
      this.hashconnect.pairingEvent.once((pairingData) => {
        console.log('HashPack paired:', pairingData);
        resolve();
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
      // Create the token creation transaction
      const transaction = new TokenCreateTransaction()
        .setTokenName(params.name)
        .setTokenSymbol(params.symbol)
        .setTokenType(TokenType.NonFungibleUnique)
        .setSupplyType(TokenSupplyType.Finite)
        .setInitialSupply(0)
        .setMaxSupply(1)
        .setTreasuryAccountId(AccountId.fromString(params.treasuryAccountId))
        .setTokenMemo(params.metadata)
        .setMaxTransactionFee(new Hbar(10))
        .freezeWith(this.hashconnect.getProvider().getClient());

      // Get transaction bytes for signing
      const transactionBytes = transaction.toBytes();

      console.log('Sending transaction to HashPack via HashConnect...');

      // Request transaction signing from HashPack
      const response = await this.hashconnect.sendTransaction(
        this.topic,
        {
          topic: this.topic,
          byteArray: transactionBytes,
          metadata: {
            accountToSign: params.treasuryAccountId,
            returnTransaction: false,
            hideNft: false
          }
        }
      );

      console.log('HashConnect transaction response:', response);

      if (response.success && response.receipt) {
        const tokenId = response.receipt.tokenId?.toString() || '';
        const transactionId = response.response?.transactionId || '';
        
        return {
          tokenId,
          transactionId,
          success: true
        };
      } else {
        throw new Error('Transaction failed or was rejected');
      }

    } catch (error) {
      console.error('HashConnect NFT creation error:', error);
      throw error;
    }
  }

  getPairingString(): string {
    return this.hashconnect.generatePairingString(this.topic, "mainnet", false);
  }

  isConnected(): boolean {
    return this.hashconnect.hcData.pairingData.length > 0;
  }

  getConnectedAccountIds(): string[] {
    return this.hashconnect.hcData.pairingData
      .map(pairing => pairing.accountIds)
      .flat();
  }
}