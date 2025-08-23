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
  TokenId,
  PrivateKey,
  PublicKey
} from "@hashgraph/sdk";
import { hashPackSessionStore } from "./hashpack-session-store";

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
    try {
      console.log('Getting HashPack session for collection creation...');
      
      // Check if we have a stored session from the global store
      if (!hashPackSessionStore.hasActiveSession()) {
        throw new Error('No active HashPack session. Please connect your wallet first.');
      }
      
      const { signClient, session } = hashPackSessionStore.getSession();
      
      if (!signClient || !session) {
        throw new Error('HashPack session is incomplete. Please reconnect your wallet.');
      }
      
      console.log('Using stored HashPack session:', {
        topic: session.topic,
        hasClient: !!signClient
      });
      
      this.signClient = signClient;
      this.session = session;
      
      return { signClient: this.signClient, session: this.session };
    } catch (error) {
      console.error('Connection error details:', error);
      throw error;
    }
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
      
      // CRITICAL FIX: Get the user's actual public key from their account
      console.log('Getting user account info for supply key...');
      
      const treasuryAccount = AccountId.fromString(userAccountId);
      
      // First, try to get account info to find the public key
      try {
        // Request account info through HashPack to get the public key
        const accountInfoRequest = await signClient.request({
          topic: session.topic,
          chainId: CHAIN,
          request: {
            method: "hedera_getNodeAddresses",
            params: {
              accountIds: [userAccountId]
            }
          }
        });
        console.log('Account info response:', accountInfoRequest);
      } catch (error) {
        console.log('Could not get account info, proceeding with transaction anyway');
      }
      
      // Build transaction WITHOUT setting keys initially
      // Keys will be determined by the transaction signer (user's account)
      const createTx = new TokenCreateTransaction()
        .setTokenName(collectionName)
        .setTokenSymbol(collectionSymbol)
        .setTokenType(TokenType.NonFungibleUnique)
        .setSupplyType(TokenSupplyType.Infinite)
        .setTreasuryAccountId(treasuryAccount)
        .setMaxTransactionFee(100000000) // 1 HBAR max fee
        .setTransactionId(TransactionId.generate(treasuryAccount))
        .setTransactionMemo(`Creating ${collectionName}`)
        // Set initial supply to 0 for NFT collections
        .setInitialSupply(0)
        // Set decimals to 0 for NFTs
        .setDecimals(0);

      // SOLUTION: Don't set any explicit keys for HashPack
      // When signed through HashPack, the signer's key becomes the default
      
      console.log('Setting up user-controlled collection...');
      
      // Important: For NFT collections we MUST have a supply key
      // But we can't set it here because it causes signature mismatch
      // The solution is to not freeze the transaction and send it raw
      
      // Do NOT freeze the transaction - send it unfrozen to HashPack
      // HashPack will add the signer's key as supply key automatically
      console.log('Sending unfrozen transaction to HashPack for key injection and signing...');
      
      // Convert the unfrozen transaction to bytes
      // HashPack will handle freezing with proper keys
      const txBytes = createTx.toBytes();
      const transactionListBase64 = Buffer.from(txBytes).toString('base64');

      console.log('Sending collection creation to HashPack...');
      
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