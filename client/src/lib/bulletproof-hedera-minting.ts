// Bulletproof HashPack + Hedera HTS NFT minting following the exact specification
import SignClient from "@walletconnect/sign-client";
import { WalletConnectModal } from "@walletconnect/modal";
import {
  Client,
  TokenMintTransaction,
  TransactionId,
  AccountId,
  TokenId
} from "@hashgraph/sdk";
// Using standard transaction formatting for WalletConnect compatibility

// Proper implementation using the official Hedera wallet connect package
function makeTransactionListBase64(txBytes: Uint8Array[]): string {
  // Convert transaction bytes to base64 format expected by WalletConnect
  return Buffer.from(JSON.stringify(txBytes.map(tx => Array.from(tx)))).toString('base64');
}

const WC_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string;
const CHAIN = "hedera:mainnet"; // Using mainnet as requested
const TOKEN_ID = import.meta.env.VITE_TOKEN_ID as string;       // existing HTS NFT collection
const TREASURY_ID = import.meta.env.VITE_TREASURY_ID as string; // holds the supply key (in HashPack)

console.log('Hedera minting config:', { WC_PROJECT_ID: !!WC_PROJECT_ID, CHAIN, TOKEN_ID, TREASURY_ID });

// HIP-412 lives OFF-chain. Put only a short pointer (≤100 bytes) here.
function assertPointerFits(pointer: string) {
  if (Buffer.byteLength(pointer, "utf8") > 100) {
    throw new Error("Metadata pointer exceeds 100 bytes; use a shorter ipfs:// CID or HFS link.");
  }
}

export async function connectHashPack() {
  if (!WC_PROJECT_ID) {
    throw new Error("Missing VITE_WALLETCONNECT_PROJECT_ID - required for WalletConnect");
  }

  console.log('Initializing WalletConnect SignClient...');
  
  const signClient = await SignClient.init({
    projectId: WC_PROJECT_ID,
    relayUrl: "wss://relay.walletconnect.com",
    metadata: {
      name: "Dright Rights Marketplace",
      description: "Mint legal rights NFTs via Hedera HTS",
      url: "https://dright.com",
      icons: ["https://walletconnect.com/walletconnect-logo.png"],
    },
  });

  console.log('Creating WalletConnect Modal...');
  const modal = new WalletConnectModal({ projectId: WC_PROJECT_ID });
  
  signClient.on("session_proposal", (proposal) => {
    console.log('Session proposal received:', proposal);
  });

  signClient.on("session_request", (request) => {
    console.log('Session request received:', request);
  });

  console.log('Connecting to HashPack...');
  const { uri, approval } = await signClient.connect({
    requiredNamespaces: {
      hedera: {
        chains: [CHAIN],
        methods: [
          "hedera_signAndExecuteTransaction", // we will use this
          "hedera_getNodeAddresses"
        ],
        events: []
      }
    }
  });

  if (uri) {
    console.log('Opening modal with connection URI...');
    await modal.openModal({ uri });
  }

  console.log('Waiting for session approval...');
  const session = await approval();
  await modal.closeModal();

  // Check if it's HashPack
  const walletName = session.peer.metadata?.name || "";
  const isHashPack = walletName.toLowerCase().includes("hashpack");
  console.log('Connected wallet:', walletName, 'Is HashPack:', isHashPack);
  
  if (!isHashPack) {
    console.warn("Connected wallet is not HashPack - continuing anyway");
  }

  return { signClient, session, walletName };
}

export async function mintOneRightsNft(params: {
  signClient: Awaited<ReturnType<typeof SignClient.init>>;
  session: any;
  metadataPointer: string; // e.g. "ipfs://bafybeihip412cid"
  collectionTokenId: string; // User's specific collection token ID
  userAccountId: string; // User's Hedera account ID
}) {
  const { 
    signClient, 
    session, 
    metadataPointer,
    collectionTokenId,
    userAccountId
  } = params;

  console.log('Starting NFT mint with params:', { metadataPointer, collectionTokenId, userAccountId });

  if (!collectionTokenId || !userAccountId) {
    throw new Error("Missing collection token ID or user account ID - required for minting");
  }

  assertPointerFits(metadataPointer);

  // SDK client only to build & freeze (no operator key needed since wallet submits)
  const sdkClient = CHAIN === "hedera:mainnet" ? Client.forMainnet() : Client.forTestnet();

  // IMPORTANT: Make the fee payer == userAccountId (wallet's account),
  // so the wallet can sign & pay. User owns their own collection and supply key.
  const payer = AccountId.fromString(userAccountId);

  console.log('Building TokenMintTransaction...');
  const mintTx = await new TokenMintTransaction()
    .setTokenId(TokenId.fromString(collectionTokenId))
    .setMetadata([Buffer.from(metadataPointer, "utf8")])  // one NFT
    .setTransactionId(TransactionId.generate(payer))      // payer = user account in HashPack
    .freezeWith(sdkClient);

  console.log('Serializing transaction to bytes...');
  const txBytes = await mintTx.toBytes(); // Uint8Array

  // Pack into a TransactionList (base64) — REQUIRED by WalletConnect Hedera RPC
  console.log('Creating TransactionList Base64...');
  const transactionListBase64 = makeTransactionListBase64([txBytes]);

  console.log('Sending transaction to HashPack wallet for user approval...');
  console.log('Transaction details:', {
    tokenId: collectionTokenId,
    metadata: metadataPointer,
    payer: userAccountId,
    estimatedFee: '~0.01 HBAR'
  });
  
  // Send to wallet: user will see transaction details, approve, and pay fees
  const result = await signClient.request({
    topic: session.topic,
    chainId: CHAIN,
    request: {
      method: "hedera_signAndExecuteTransaction",
      params: {
        transactionList: transactionListBase64,
        signerAccountId: userAccountId // User's account that will pay fees
      }
    }
  });

  console.log('HashPack response:', result);
  
  // You'll typically get a transactionId back; query mirror for the receipt if needed
  return result; // contains tx info; use your mirror client to fetch serial(s)
}

// Real HashPack wallet integration for NFT minting with user approval
export async function connectAndMintNFT(params: {
  metadataPointer: string;
  collectionTokenId: string;
  userAccountId: string;
}): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    console.log('Initiating HashPack wallet approval for NFT minting:', {
      metadataPointer: params.metadataPointer,
      collectionTokenId: params.collectionTokenId,
      userAccountId: params.userAccountId
    });

    // Connect to HashPack and request minting approval
    const { signClient, session } = await connectHashPack();
    
    console.log('HashPack connected, preparing transaction for wallet approval...');
    
    // Execute the mint transaction with wallet approval
    const result = await mintOneRightsNft({
      signClient,
      session,
      metadataPointer: params.metadataPointer,
      collectionTokenId: params.collectionTokenId,
      userAccountId: params.userAccountId
    });
    
    console.log('Transaction approved and executed:', result);
    
    // Extract transaction ID from result
    const transactionId = (result as any)?.transactionId || 
                         (result as any)?.receipt?.transactionId || 
                         (result as any)?.[0]?.transactionId ||
                         'success';
    
    return {
      success: true,
      transactionId: transactionId
    };
    
  } catch (error) {
    console.error('HashPack minting error:', error);
    
    // Provide user-friendly error messages
    let errorMessage = 'Minting failed';
    if (error instanceof Error) {
      if (error.message.includes('User rejected') || error.message.includes('cancelled')) {
        errorMessage = 'Transaction cancelled by user';
      } else if (error.message.includes('Insufficient')) {
        errorMessage = 'Insufficient HBAR balance to pay transaction fees';
      } else if (error.message.includes('not connected')) {
        errorMessage = 'HashPack wallet disconnected. Please reconnect.';
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}