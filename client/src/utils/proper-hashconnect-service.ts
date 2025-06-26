import { HashConnect, HashConnectTypes, MessageTypes } from "@hashgraph/hashconnect";

// App metadata following the reference repository pattern
const APP_METADATA: HashConnectTypes.AppMetadata = {
  name: "Dright - Rights Marketplace",
  description: "Trade intellectual property rights as NFTs on Hedera",
  icons: ["https://dright.app/favicon.ico"],
  url: "https://dright.app"
};

export class ProperHashConnectService {
  private hashconnect: HashConnect;
  private state: HashConnectTypes.AppMetadata | null = null;
  private pairingTopic: string = "";
  private availableExtension: HashConnectTypes.WalletMetadata | null = null;
  private accountId: string = "";
  private network: string = "mainnet";

  constructor() {
    this.hashconnect = new HashConnect(true); // Enable debug mode
  }

  // Initialize HashConnect with proper metadata and event handlers
  async init(): Promise<void> {
    console.log("🔄 Initializing HashConnect...");
    
    // Clear any existing pairing data first
    localStorage.removeItem("hashconnectData");
    localStorage.removeItem("hashconnect");
    
    // Set up event listeners BEFORE calling init
    this.setupEventListeners();
    
    // Initialize with fresh state
    const initData = await this.hashconnect.init(APP_METADATA, this.network, false);
    this.state = initData;
    
    console.log("✅ HashConnect initialized:", initData);
  }

  private setupEventListeners(): void {
    // Connection established
    this.hashconnect.pairingEvent.on((pairingData) => {
      console.log("✅ Pairing event received:", pairingData);
      this.pairingTopic = pairingData.topic;
      
      // Save pairing data properly
      localStorage.setItem("hashconnectData", JSON.stringify(pairingData));
    });

    // Extension found
    this.hashconnect.foundExtensionEvent.on((extensionData) => {
      console.log("✅ Extension found:", extensionData);
      this.availableExtension = extensionData;
    });

    // Account response
    this.hashconnect.connectionStatusChangeEvent.on((connectionStatus) => {
      console.log("✅ Connection status changed:", connectionStatus);
      
      if (connectionStatus === "Connected") {
        // Get account info from the paired data
        const pairingData = this.hashconnect.hcData.pairingData;
        if (pairingData && pairingData[0] && pairingData[0].accountIds) {
          this.accountId = pairingData[0].accountIds[0];
          console.log("✅ Account connected:", this.accountId);
        }
      }
    });
  }

  // Connect to HashPack following official pattern
  async connect(): Promise<string> {
    if (!this.state) {
      throw new Error("HashConnect not initialized. Call init() first.");
    }

    console.log("🔄 Starting connection...");

    // Check for saved pairing data
    const savedData = localStorage.getItem("hashconnectData");
    if (savedData) {
      try {
        const pairingData = JSON.parse(savedData);
        console.log("🔄 Attempting to restore saved pairing...");
        
        // Restore with saved pairing data
        await this.hashconnect.connect(pairingData);
        
        if (this.accountId) {
          console.log("✅ Restored connection successful:", this.accountId);
          return this.accountId;
        }
      } catch (error) {
        console.log("⚠️ Saved pairing data invalid, starting fresh connection");
        localStorage.removeItem("hashconnectData");
      }
    }

    // Start fresh connection
    const connectionData = await this.hashconnect.connect();
    console.log("🔄 Fresh connection started:", connectionData);

    // Wait for pairing to complete
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Connection timeout - please approve the pairing in HashPack"));
      }, 60000);

      // Listen for successful connection
      const checkConnection = setInterval(() => {
        if (this.accountId) {
          clearTimeout(timeout);
          clearInterval(checkConnection);
          resolve(this.accountId);
        }
      }, 1000);

      // Also listen for pairing event
      this.hashconnect.pairingEvent.once(() => {
        setTimeout(() => {
          if (this.accountId) {
            clearTimeout(timeout);
            clearInterval(checkConnection);
            resolve(this.accountId);
          }
        }, 2000); // Give time for account info to be populated
      });
    });
  }

  // Check if already connected
  isConnected(): boolean {
    return !!this.accountId && this.hashconnect.connectionStatus === "Connected";
  }

  // Get current account ID
  getAccountId(): string {
    return this.accountId;
  }

  // Disconnect and clear data
  disconnect(): void {
    this.hashconnect.disconnect();
    this.accountId = "";
    this.pairingTopic = "";
    this.availableExtension = null;
    localStorage.removeItem("hashconnectData");
    console.log("✅ HashConnect disconnected");
  }

  // Send transaction (for future use)
  async sendTransaction(transaction: any): Promise<any> {
    if (!this.isConnected()) {
      throw new Error("Not connected to wallet");
    }

    const response = await this.hashconnect.sendTransaction(this.pairingTopic, transaction);
    return response;
  }
}

// Singleton instance
export const properHashConnectService = new ProperHashConnectService();