// Hedera transaction handling for NFT minting via HashPack
import { Client, AccountId, PrivateKey, TokenCreateTransaction, TokenType, TokenSupplyType, Hbar } from '@hashgraph/sdk';

export interface HederaNFTParams {
  name: string;
  symbol: string;
  metadata: string;
  treasuryAccountId: string;
  adminKeys?: string[];
}

export interface HederaTransactionResult {
  tokenId: string;
  transactionId: string;
  transactionHash: string;
  receipt: any;
}

export class HederaTransactionService {
  
  /**
   * Create NFT token transaction for HashPack signing
   */
  static async createNFTTransaction(params: HederaNFTParams): Promise<TokenCreateTransaction> {
    const client = Client.forMainnet();
    
    const transaction = new TokenCreateTransaction()
      .setTokenName(params.name)
      .setTokenSymbol(params.symbol)
      .setTokenType(TokenType.NonFungibleUnique)
      .setSupplyType(TokenSupplyType.Finite)
      .setInitialSupply(0)
      .setMaxSupply(1)
      .setTreasuryAccountId(AccountId.fromString(params.treasuryAccountId))
      .setTokenMemo(params.metadata)
      .setMaxTransactionFee(new Hbar(10)); // 10 HBAR fee
    
    // Set admin keys if provided
    if (params.adminKeys && params.adminKeys.length > 0) {
      const adminKey = AccountId.fromString(params.adminKeys[0]);
      transaction.setAdminKey(adminKey);
      transaction.setSupplyKey(adminKey);
    }
    
    return transaction;
  }

  /**
   * Sign and execute transaction via HashPack
   */
  static async executeWithHashPack(transaction: TokenCreateTransaction): Promise<HederaTransactionResult> {
    try {
      // Check if HashPack is available
      const hashPack = (window as any).hashpack || (window as any).HashPack;
      
      if (!hashPack) {
        throw new Error('HashPack wallet not found. Please install HashPack extension.');
      }
      
      // Get transaction bytes for signing
      const transactionBytes = transaction.toBytes();
      
      // Request HashPack to sign transaction
      const signResponse = await hashPack.requestTransaction({
        topic: 'nft-mint',
        byteArray: transactionBytes,
        metadata: {
          accountToSign: transaction.treasuryAccountId?.toString(),
          returnTransaction: false
        }
      });
      
      if (!signResponse.success) {
        throw new Error('Transaction was rejected by user or failed to sign');
      }
      
      // Create client and execute signed transaction
      const client = Client.forMainnet();
      const signedTransaction = transaction.addSignature(
        transaction.treasuryAccountId!,
        signResponse.signedTransaction
      );
      
      const response = await signedTransaction.execute(client);
      const receipt = await response.getReceipt(client);
      
      if (receipt.status.toString() !== 'SUCCESS') {
        throw new Error('Transaction failed: ' + receipt.status.toString());
      }
      
      return {
        tokenId: receipt.tokenId?.toString() || '',
        transactionId: response.transactionId.toString(),
        transactionHash: response.transactionHash.toString(),
        receipt: receipt
      };
      
    } catch (error) {
      console.error('HashPack transaction error:', error);
      throw error;
    }
  }
}