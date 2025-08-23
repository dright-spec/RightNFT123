// Bulletproof HashPack integration following the exact recipe
import SignClient from "@walletconnect/sign-client";
import WalletConnectModal from "@walletconnect/modal";
import { 
  Client as HederaClient, 
  TokenMintTransaction, 
  TransactionId, 
  AccountId, 
  TokenId 
} from "@hashgraph/sdk";
// import { HederaWalletConnect } from "@momental-org/hedera-wallet-connect";

export class BulletproofHashPack {
  private signClient: SignClient | null = null;
  private modal: any = null;
  private session: any = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;

    const WC_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "2f05a7cee75d4f65c6bbdf8f84b9e37c";
    
    console.log('Initializing WalletConnect SignClient...');
    
    // 1) Initialize SignClient
    this.signClient = await SignClient.init({
      projectId: WC_PROJECT_ID,
      relayUrl: "wss://relay.walletconnect.org",
      metadata: {
        name: "Dright",
        description: "Digital Rights Marketplace on Hedera",
        url: window.location.origin,
        icons: [`${window.location.origin}/favicon.ico`]
      }
    });

    // 2) Initialize modal
    this.modal = new WalletConnectModal({ 
      projectId: WC_PROJECT_ID,
      themeMode: 'light' as any
    });

    // 3) Set up event listeners for debugging
    this.signClient.on("session_proposal" as any, (p: any) => console.log("session_proposal", p));
    this.signClient.on("session_request" as any, (r: any) => console.log("session_request", r));
    this.signClient.on("pairing_created" as any, (p: any) => console.log("pairing_created", p));
    this.signClient.on("display_uri" as any, (data: any) => {
      console.log("display_uri received:", data.uri);
      if (this.modal && data.uri) {
        this.modal.openModal({ uri: data.uri });
      }
    });

    this.isInitialized = true;
    console.log('WalletConnect SignClient initialized successfully');
  }

  async connectWallet(): Promise<{ success: boolean; accountId?: string; error?: string }> {
    try {
      if (!this.signClient || !this.modal) {
        throw new Error('SignClient not initialized');
      }

      console.log('Starting wallet connection...');

      // 3) Request session with proper Hedera namespace
      const requiredNamespaces = {
        hedera: {
          methods: ["hedera_signAndExecuteTransaction", "hedera_getNodeAddresses"],
          chains: ["hedera:mainnet"], // Use mainnet
          events: []
        }
      };

      console.log('Requesting WalletConnect session with namespaces:', requiredNamespaces);

      const { uri, approval } = await this.signClient.connect({ requiredNamespaces });
      
      if (uri) {
        console.log('Opening modal with URI:', uri);
        await this.modal.openModal({ uri });
      }

      console.log('Waiting for wallet approval...');
      
      // 4) Wait for user approval
      this.session = await approval();
      await this.modal.closeModal();
      
      console.log('Session approved:', this.session.topic, this.session.namespaces);

      // Extract account ID from session
      const hederaAccounts = this.session.namespaces.hedera?.accounts || [];
      if (hederaAccounts.length === 0) {
        throw new Error('No Hedera accounts found in session');
      }

      const accountId = hederaAccounts[0].replace("hedera:mainnet:", "");
      console.log('Connected account:', accountId);

      return {
        success: true,
        accountId: accountId
      };

    } catch (error) {
      console.error('Wallet connection error:', error);
      if (this.modal) {
        await this.modal.closeModal();
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      };
    }
  }

  async mintNFT(params: {
    tokenId: string;
    metadataUri: string;
    accountId: string;
  }): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      if (!this.signClient || !this.session) {
        throw new Error('Wallet not connected');
      }

      console.log('Building TokenMint transaction with metadata:', {
        tokenId: params.tokenId,
        metadataUri: params.metadataUri,
        accountId: params.accountId,
        estimatedCost: '~0.01 HBAR for NFT minting'
      });

      // Build TokenMintTransaction using Hedera SDK
      const client = HederaClient.forMainnet();
      const tx = await new TokenMintTransaction()
        .setTokenId(TokenId.fromString(params.tokenId))
        .setMetadata([Buffer.from(params.metadataUri)]) // HIP-412 pointer in bytes
        .setTransactionId(TransactionId.generate(AccountId.fromString(params.accountId)))
        .setTransactionMemo(`Minting Rights NFT - Metadata: ${params.metadataUri}`) // Add clear memo
        .freezeWith(client);

      const txBytes = await tx.toBytes();
      console.log('Transaction bytes generated, length:', txBytes.length);

      // 5) Use simple Base64 encoding for TransactionList (fallback)
      // const hwc = new HederaWalletConnect();
      // const transactionListBase64 = hwc.makeTransactionListBase64([txBytes]);
      const transactionListBase64 = Buffer.from(txBytes).toString('base64');
      
      console.log('TransactionList Base64 created, sending to wallet...');

      // 6) Send to wallet via SignClient.request
      const result = await this.signClient.request({
        topic: this.session.topic,
        chainId: "hedera:mainnet",
        request: {
          method: "hedera_signAndExecuteTransaction",
          params: {
            signerAccountId: params.accountId,
            transactionList: transactionListBase64
          }
        }
      });

      console.log('Wallet response:', result);

      if (result && (result as any).transactionId) {
        return {
          success: true,
          transactionId: (result as any).transactionId
        };
      } else if (result && (result as any).transactionHash) {
        return {
          success: true,
          transactionId: (result as any).transactionHash
        };
      } else {
        throw new Error('No transaction ID returned from wallet');
      }

    } catch (error) {
      console.error('NFT minting error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Minting failed'
      };
    }
  }

  isConnected(): boolean {
    return this.session !== null;
  }

  getAccountId(): string | null {
    if (!this.session) return null;
    const accounts = this.session.namespaces.hedera?.accounts || [];
    return accounts.length > 0 ? accounts[0].replace("hedera:mainnet:", "") : null;
  }

  async disconnect() {
    if (this.signClient && this.session) {
      await this.signClient.disconnect({
        topic: this.session.topic,
        reason: { code: 6000, message: "User disconnected" }
      });
    }
    this.session = null;
    console.log('Wallet disconnected');
  }
}

// Singleton instance
export const hashPackService = new BulletproofHashPack();