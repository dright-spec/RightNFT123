// User Collection Manager - handles creating and managing per-user NFT collections
import SignClient from "@walletconnect/sign-client";
import { WalletConnectModal } from "@walletconnect/modal";
import {
  Client,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  AccountId,
  TransactionId,
  TokenMintTransaction,
  TokenId
} from "@hashgraph/sdk";

const WC_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string;
const CHAIN = "hedera:mainnet";

interface UserCollection {
  tokenId: string;
  treasuryAccountId: string;
  userName: string;
  status: 'creating' | 'created' | 'failed';
}

export class UserCollectionManager {
  private signClient: SignClient | null = null;
  private session: any = null;

  /**
   * Use existing HashPack connection - no separate initialization needed
   */
  async connect(): Promise<{ signClient: SignClient; session: any }> {
    // Import the existing HashPack service instead of creating a new WalletConnect instance
    const { hashPackService } = await import('./bulletproof-hashpack');
    
    // Use the existing connection
    await hashPackService.initialize();
    const signClient = hashPackService.getSignClient();
    const sessions = signClient?.session.getAll() || [];
    
    if (!signClient || sessions.length === 0) {
      throw new Error('HashPack wallet must be connected first. Please connect your wallet and try again.');
    }

    // Use the first available session (the current connected session)
    const session = sessions[0];
    
    console.log('Using existing HashPack connection for collection creation');
    
    this.signClient = signClient;
    this.session = session;

    return { signClient, session };
  }

  /**
   * Create a new NFT collection for the user
   */
  async createUserCollection(params: {
    userAccountId: string;
    userName: string;
    displayName?: string;
  }): Promise<{ success: boolean; tokenId?: string; transactionId?: string; error?: string }> {
    try {
      const { signClient, session } = await this.connect();
      const { userAccountId, userName, displayName } = params;

      // Generate collection details
      const collectionName = `${displayName || userName} Rights Collection`;
      const collectionSymbol = this.generateTokenSymbol(userName);

      console.log(`Creating collection: ${collectionName} (${collectionSymbol})`);

      // Build TokenCreateTransaction
      const sdkClient = Client.forMainnet();
      
      const createTx = await new TokenCreateTransaction()
        .setTokenName(collectionName)
        .setTokenSymbol(collectionSymbol)
        .setTokenType(TokenType.NonFungibleUnique)
        .setSupplyType(TokenSupplyType.Infinite)
        .setTreasuryAccountId(AccountId.fromString(userAccountId))
        // Note: For user-controlled supply key, we'd need the user's public key
        // For now, let's assume the platform manages supply keys for users
        // .setSupplyKey(supplyKey) // This would need to be passed as a parameter
        .setTransactionId(TransactionId.generate(AccountId.fromString(userAccountId)))
        .freezeWith(sdkClient);

      const txBytes = await createTx.toBytes();
      const transactionListBase64 = this.makeTransactionListBase64([txBytes]);

      console.log('Sending collection creation to HashPack...');
      
      // Send to wallet
      const result = await signClient.request({
        topic: session.topic,
        chainId: CHAIN,
        request: {
          method: "hedera_signAndExecuteTransaction",
          params: {
            transactionList: transactionListBase64,
            signerAccountId: userAccountId
          }
        }
      });

      console.log('Collection creation response:', result);

      // Extract token ID from response
      // Note: The actual token ID would need to be queried from the transaction receipt
      // For now, we'll return success and let the backend handle the token ID extraction
      
      return {
        success: true,
        transactionId: (result as any)?.transactionId || (result as any)?.txId || 'pending'
      };

    } catch (error) {
      console.error('Collection creation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Mint an NFT to the user's collection
   */
  async mintToUserCollection(params: {
    collectionTokenId: string;
    metadataPointer: string;
    userAccountId: string;
  }): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      const { signClient, session } = await this.connect();
      const { collectionTokenId, metadataPointer, userAccountId } = params;

      console.log(`Minting to collection ${collectionTokenId} for user ${userAccountId}`);

      // Verify metadata pointer size
      if (Buffer.byteLength(metadataPointer, "utf8") > 100) {
        throw new Error("Metadata pointer exceeds 100 bytes");
      }

      // Build TokenMintTransaction
      const sdkClient = Client.forMainnet();
      
      const mintTx = await new TokenMintTransaction()
        .setTokenId(TokenId.fromString(collectionTokenId))
        .setMetadata([Buffer.from(metadataPointer, "utf8")])
        .setTransactionId(TransactionId.generate(AccountId.fromString(userAccountId)))
        .freezeWith(sdkClient);

      const txBytes = await mintTx.toBytes();
      const transactionListBase64 = this.makeTransactionListBase64([txBytes]);

      console.log('Sending mint transaction to HashPack...');
      
      // Send to wallet
      const result = await signClient.request({
        topic: session.topic,
        chainId: CHAIN,
        request: {
          method: "hedera_signAndExecuteTransaction",
          params: {
            transactionList: transactionListBase64,
            signerAccountId: userAccountId
          }
        }
      });

      console.log('Mint transaction response:', result);

      return {
        success: true,
        transactionId: (result as any)?.transactionId || (result as any)?.txId || 'success'
      };

    } catch (error) {
      console.error('Minting to user collection failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Generate a unique token symbol
   */
  private generateTokenSymbol(userName: string): string {
    const baseSymbol = userName.substring(0, 3).toUpperCase() + 'R';
    const timestamp = Date.now().toString().slice(-4);
    return `${baseSymbol}${timestamp}`;
  }

  /**
   * Create TransactionList Base64 for WalletConnect
   */
  private makeTransactionListBase64(txBytes: Uint8Array[]): string {
    return Buffer.from(JSON.stringify(txBytes.map(tx => Array.from(tx)))).toString('base64');
  }

  /**
   * Disconnect from wallet
   */
  async disconnect() {
    if (this.signClient && this.session) {
      await this.signClient.disconnect({
        topic: this.session.topic,
        reason: { code: 6000, message: "User disconnected" },
      });
      this.signClient = null;
      this.session = null;
    }
  }
}

// Export singleton instance
export const userCollectionManager = new UserCollectionManager();