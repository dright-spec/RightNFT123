// HashPack collection creation with proper key handling
import { 
  Client,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  AccountId,
  TransactionId,
  PublicKey
} from "@hashgraph/sdk";

/**
 * Creates an NFT collection where the user's account key controls the supply
 * This allows the user to mint NFTs using their HashPack wallet
 */
export async function createUserControlledCollection(params: {
  userAccountId: string;
  collectionName: string;
  collectionSymbol: string;
  signClient: any;
  session: any;
}) {
  const { userAccountId, collectionName, collectionSymbol, signClient, session } = params;
  
  console.log('Creating user-controlled NFT collection...');
  
  const client = Client.forMainnet();
  const treasuryAccount = AccountId.fromString(userAccountId);
  
  // Build the transaction
  // The key trick here is that we're setting keys to the treasury account
  // When the user signs this through HashPack, their account's key will be used
  const transaction = new TokenCreateTransaction()
    .setTokenName(collectionName)
    .setTokenSymbol(collectionSymbol)
    .setTokenType(TokenType.NonFungibleUnique)
    .setSupplyType(TokenSupplyType.Infinite)
    .setTreasuryAccountId(treasuryAccount)
    .setMaxTransactionFee(100000000) // 1 HBAR max fee
    // Set keys to treasury account - the signer's key will control these
    .setSupplyKey(treasuryAccount)
    .setAdminKey(treasuryAccount)
    // Optional: freeze and wipe keys for full control
    .setFreezeKey(treasuryAccount)
    .setWipeKey(treasuryAccount)
    .setTransactionId(TransactionId.generate(treasuryAccount))
    .setTransactionMemo(`NFT Collection: ${collectionName}`)
    .freezeWith(client);

  // Convert to bytes for WalletConnect
  const txBytes = await transaction.toBytes();
  const transactionListBase64 = Buffer.from(txBytes).toString('base64');
  
  console.log('Sending collection creation to HashPack with user-controlled keys...');
  
  // Send to HashPack for signature and execution
  const result = await signClient.request({
    topic: session.topic,
    chainId: "hedera:mainnet",
    request: {
      method: "hedera_signAndExecuteTransaction",
      params: {
        transactionList: transactionListBase64,
        signerAccountId: userAccountId
      }
    }
  });
  
  console.log('Collection created with user as supply key controller!');
  return result;
}

/**
 * Alternative approach using PublicKey directly
 * This requires getting the user's public key from HashPack first
 */
export async function createCollectionWithExplicitKey(params: {
  userAccountId: string;
  userPublicKey: string; // Hex encoded public key
  collectionName: string;
  collectionSymbol: string;
  signClient: any;
  session: any;
}) {
  const { userAccountId, userPublicKey, collectionName, collectionSymbol, signClient, session } = params;
  
  const client = Client.forMainnet();
  const treasuryAccount = AccountId.fromString(userAccountId);
  const publicKey = PublicKey.fromString(userPublicKey);
  
  const transaction = new TokenCreateTransaction()
    .setTokenName(collectionName)
    .setTokenSymbol(collectionSymbol)
    .setTokenType(TokenType.NonFungibleUnique)
    .setSupplyType(TokenSupplyType.Infinite)
    .setTreasuryAccountId(treasuryAccount) // User is treasury - NFTs go directly to their wallet
    .setMaxTransactionFee(100000000)
    // Use the actual public key - user controls minting
    .setSupplyKey(publicKey)
    // No admin key - prevents token deletion and ensures permanence
    // .setAdminKey(publicKey) // Commented out for security
    .setTransactionId(TransactionId.generate(treasuryAccount))
    .setTransactionMemo(`User ${userAccountId} NFT Collection`)
    .freezeWith(client);

  const txBytes = await transaction.toBytes();
  const transactionListBase64 = Buffer.from(txBytes).toString('base64');
  
  const result = await signClient.request({
    topic: session.topic,
    chainId: "hedera:mainnet",
    request: {
      method: "hedera_signAndExecuteTransaction",
      params: {
        transactionList: transactionListBase64,
        signerAccountId: userAccountId
      }
    }
  });
  
  return result;
}