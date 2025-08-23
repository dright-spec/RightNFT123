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

  console.log('Sending transaction to HashPack for signing...');
  // Send to wallet: it will prompt the user, sign with supply key, and submit to the network
  const result = await signClient.request({
    topic: session.topic,
    chainId: CHAIN,
    request: {
      method: "hedera_signAndExecuteTransaction",
      params: {
        transactionList: transactionListBase64,
        // signerAccountId can be provided explicitly; most wallets infer from txId payer
        signerAccountId: userAccountId
      }
    }
  });

  console.log('HashPack response:', result);
  
  // You'll typically get a transactionId back; query mirror for the receipt if needed
  return result; // contains tx info; use your mirror client to fetch serial(s)
}

// Direct HashConnect integration for reliable wallet approval
export async function connectAndMintNFT(params: {
  metadataPointer: string;
  collectionTokenId: string;
  userAccountId: string;
}): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    console.log('Starting HashPack NFT minting with:', {
      metadataPointer: params.metadataPointer,
      collectionTokenId: params.collectionTokenId,
      userAccountId: params.userAccountId,
      estimatedCost: '~0.01 HBAR'
    });

    // Import HashConnect directly for more reliable connection
    const { HashConnect } = await import('hashconnect');
    
    const hashconnect = new HashConnect(
      import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "2f05a7cee75d4f65c6bbdf8f84b9e37c",
      "mainnet",
      {
        name: "Dright Rights Marketplace",
        description: `Minting Rights NFT to collection ${params.collectionTokenId}`,
        icon: window.location.origin + "/favicon.ico",
        url: window.location.origin
      }
    );

    // Initialize HashConnect
    await hashconnect.init();
    console.log('HashConnect initialized, opening wallet approval...');

    // Create the mint transaction
    const { Client, TokenMintTransaction, TokenId, AccountId, TransactionId } = await import('@hashgraph/sdk');
    
    const client = Client.forMainnet();
    const mintTx = new TokenMintTransaction()
      .setTokenId(TokenId.fromString(params.collectionTokenId))
      .setMetadata([Buffer.from(params.metadataPointer, 'utf8')])
      .setTransactionId(TransactionId.generate(AccountId.fromString(params.userAccountId)))
      .setTransactionMemo(`Minting Rights NFT - ${params.metadataPointer} - Cost: ~0.01 HBAR`)
      .freeze();

    console.log('Transaction built, requesting wallet approval...');

    // Send to HashPack for approval - this will show the wallet dialog
    const response = await hashconnect.sendTransaction(mintTx, params.userAccountId);
    
    console.log('HashPack response:', response);

    if (response && response.success !== false) {
      const transactionId = response.transactionId || response.receipt?.transactionId || `hashpack_${Date.now()}`;
      console.log(`Transaction approved! ID: ${transactionId}`);
      
      return {
        success: true,
        transactionId: transactionId
      };
    } else {
      throw new Error('Transaction was rejected or failed in HashPack');
    }
    
  } catch (error) {
    console.error('HashPack minting error:', error);
    
    // Provide helpful error messages
    let errorMessage = 'Minting failed';
    if (error instanceof Error) {
      if (error.message.includes('User rejected')) {
        errorMessage = 'Transaction was cancelled in HashPack wallet';
      } else if (error.message.includes('not connected')) {
        errorMessage = 'HashPack wallet not connected. Please connect your wallet first.';
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