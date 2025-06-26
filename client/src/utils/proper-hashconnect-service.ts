import { HashConnect, HashConnectTypes } from "@hashgraph/hashconnect";

const APP_METADATA: HashConnectTypes.AppMetadata = {
  name: "Dright - Rights Marketplace",
  description: "Connect your HashPack wallet",
  icon: "https://dright.app/favicon.ico"
};

// choose "testnet" or "mainnet" here:
const NETWORK: "testnet" | "mainnet" = "testnet";

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

    // 1. init (generates private/encryption keys)
    const initData = await this.hashconnect.init(
      APP_METADATA,
      NETWORK,
      false
    );

    console.log("✅ HashConnect initialized:", initData);

    // 2. create pairing (opens QR/extension popup)
    const { topic, pairingString } = initData;
    this.topic = topic;
    
    console.log("🔄 Starting pairing process...");
    await this.hashconnect.connect(pairingString);

    // 3. listen for when user approves in wallet
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Connection timeout - please approve the pairing in HashPack"));
      }, 30000);

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
          resolve(this.pairedAccount);
        } else {
          reject(new Error("No Hedera account returned"));
        }
      });
    });
  }

  getAccount(): string | null {
    return this.pairedAccount;
  }

  disconnect(): void {
    if (this.topic) {
      this.hashconnect.disconnect(this.topic);
      this.topic = null;
    }
    this.pairedAccount = null;
  }
}

// Singleton instance
export const hashPackConnector = new HashPackConnector();