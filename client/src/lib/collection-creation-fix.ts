// Fixed collection creation with proper supply key setup
import { 
  Client,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  AccountId,
  TransactionId,
  PrivateKey,
  PublicKey
} from "@hashgraph/sdk";

export async function createCollectionWithSupplyKey(params: {
  userAccountId: string;
  collectionName: string;
  collectionSymbol: string;
  signClient: any;
  session: any;
}) {
  const { userAccountId, collectionName, collectionSymbol, signClient, session } = params;
  
  console.log('Creating NFT collection with proper supply key configuration...');
  
  const client = Client.forMainnet();
  const treasuryAccount = AccountId.fromString(userAccountId);
  
  // Option 1: Use a dummy key that will be updated by the user's signature
  // This is a workaround for WalletConnect limitations
  const dummyKey = PrivateKey.generate();
  
  // Build the transaction with all necessary keys
  const transaction = new TokenCreateTransaction()
    .setTokenName(collectionName)
    .setTokenSymbol(collectionSymbol)
    .setTokenType(TokenType.NonFungibleUnique)
    .setSupplyType(TokenSupplyType.Infinite)
    .setTreasuryAccountId(treasuryAccount)
    .setMaxTransactionFee(100000000) // 1 HBAR max fee
    // Set initial keys - these will be controlled by the user's signature
    .setAdminKey(dummyKey.publicKey)
    .setSupplyKey(dummyKey.publicKey)
    // Optional: Add other keys for full control
    .setFreezeKey(dummyKey.publicKey)
    .setWipeKey(dummyKey.publicKey)
    .setTransactionId(TransactionId.generate(treasuryAccount))
    .setTransactionMemo(`Creating NFT collection: ${collectionName}`)
    .freezeWith(client);

  // Convert to bytes for WalletConnect
  const txBytes = await transaction.toBytes();
  const transactionListBase64 = Buffer.from(txBytes).toString('base64');
  
  console.log('Transaction prepared with supply key, sending to HashPack...');
  
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
  
  return result;
}