import { HashConnect, HashConnectTypes } from "@hashgraph/hashconnect";

const APP_METADATA: HashConnectTypes.AppMetadata = {
  name: "Dright - Rights Marketplace",
  description: "Trade intellectual property rights as NFTs on Hedera",
  icon: "https://dright.app/favicon.ico"
};

// Use mainnet for production, testnet for development
const NETWORK: "testnet" | "mainnet" = "mainnet";

export class HashPackConnector {
  private hashconnect: HashConnect;
  private topic: string | null = null;
  private pairedAccount: string | null = null;

  constructor() {
    this.hashconnect = new HashConnect();
  }

  async connect(): Promise<string> {
    if (this.pairedAccount) return this.pairedAccount;

    console.log("🔄 Initializing HashConnect...");
    
    // Clear any existing pairing data first
    localStorage.removeItem("hashconnectData");
    localStorage.removeItem("hashconnect");

    // 1. init (generates private/encryption keys)
    const initData = await this.hashconnect.init(
      APP_METADATA,
      NETWORK,
      false,
      {} // no saved privKey
    );

    console.log("✅ HashConnect initialized:", initData);

    // 2. create pairing (opens QR/extension popup)
    const { topic, pairingString } = initData;
    this.topic = topic;
    
    console.log("🔄 Starting pairing process...");
    await this.hashconnect.connect({ pairingString });

    // 3. listen for when user approves in wallet
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Connection timeout - please approve the pairing in HashPack"));
      }, 60000);

      this.hashconnect.pairingEvent.once((pairing) => {
        clearTimeout(timeout);
        
        console.log("✅ Pairing event received:", pairing);
        
        if (
          pairing.accountIds &&
          pairing.accountIds.length > 0 &&
          pairing.network === NETWORK
        ) {
          this.pairedAccount = pairing.accountIds[0];
          console.log("✅ Account connected:", this.pairedAccount);
          
          // Save pairing data properly
          localStorage.setItem("hashconnectData", JSON.stringify(pairing));
          
          resolve(this.pairedAccount);
        } else {
          reject(new Error("No Hedera account returned from pairing"));
        }
      });

      // Handle connection errors
      this.hashconnect.connectionStatusChangeEvent.on((status) => {
        console.log("Connection status:", status);
      });
    });
  }

  getAccount(): string | null {
    return this.pairedAccount;
  }

  isConnected(): boolean {
    return !!this.pairedAccount;
  }

  disconnect(): void {
    if (this.topic) {
      this.hashconnect.disconnect(this.topic);
      this.topic = null;
    }
    this.pairedAccount = null;
    localStorage.removeItem("hashconnectData");
    console.log("✅ HashConnect disconnected");
  }

  // Send transaction (for future use)
  async sendTransaction(transaction: any): Promise<any> {
    if (!this.isConnected() || !this.topic) {
      throw new Error("Not connected to wallet");
    }

    const response = await this.hashconnect.sendTransaction(this.topic, transaction);
    return response;
  }
}

// Singleton instance
export const hashPackConnector = new HashPackConnector();