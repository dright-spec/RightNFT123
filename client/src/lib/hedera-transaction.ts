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
   * Sign and execute transaction via HashPack using WalletConnect/Reown AppKit
   */
  static async executeWithHashPack(transaction: TokenCreateTransaction): Promise<HederaTransactionResult> {
    try {
      // Use the already connected wallet through WalletConnect
      const provider = (window as any).ethereum;
      
      if (!provider) {
        throw new Error('No wallet provider found');
      }
      
      // Check if it's HashPack specifically
      console.log('Provider details:', {
        isHashPack: provider.isHashPack,
        name: provider.name,
        provider: provider
      });
      
      // Create a transaction request for HashPack via WalletConnect
      const transactionRequest = {
        method: 'wallet_sendTransaction',
        params: [{
          to: transaction.treasuryAccountId?.toString() || '0.0.295',
          value: '0xa968163f0a57b400000', // 10 HBAR in hex wei (10 * 10^18)
          data: JSON.stringify({
            type: 'TOKEN_CREATE',
            name: transaction.tokenName || 'Rights NFT',
            symbol: transaction.tokenSymbol || 'DRIGHT',
            memo: transaction.tokenMemo || 'Digital Rights NFT',
            tokenType: 'NON_FUNGIBLE_UNIQUE',
            supplyType: 'FINITE',
            maxSupply: 1,
            initialSupply: 0
          })
        }]
      };
      
      console.log('Sending transaction request to HashPack:', transactionRequest);
      
      // Request transaction through the connected provider
      const txHash = await provider.request(transactionRequest);
      
      console.log('Transaction hash received:', txHash);
      
      // For demo purposes, return a properly formatted response
      // In a real implementation, this would wait for confirmation and get the actual token ID
      return {
        tokenId: `0.0.${Math.floor(Math.random() * 10000000)}`, // Real token ID would come from Hedera
        transactionId: txHash,
        transactionHash: txHash,
        receipt: { status: 'SUCCESS' }
      };
      
    } catch (error) {
      console.error('HashPack transaction error:', error);
      throw error;
    }
  }
}