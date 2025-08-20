// HashPack wallet integration for Hedera network
export interface HashPackMetadata {
  name: string
  description: string
  icons: string[]
  url: string
}

export interface HashPackAccount {
  accountId: string
  network: string
}

export class HashPackWallet {
  private metadata: HashPackMetadata
  private accounts: HashPackAccount[] = []
  private isConnectedState: boolean = false

  constructor() {
    this.metadata = {
      name: "Dright",
      description: "Digital Rights Marketplace on Hedera",
      icons: ["https://dright.com/favicon.ico"],
      url: "https://dright.com"
    }

    this.init()
  }

  private async init() {
    // Check if HashPack is available
    this.checkHashPackAvailability()
  }

  private checkHashPackAvailability() {
    // Check if HashPack extension is installed
    if (typeof window !== 'undefined' && (window as any).hashconnect) {
      console.log("HashPack extension detected")
      return true
    }
    return false
  }

  // Check if HashPack extension is available
  isExtensionAvailable(): boolean {
    return this.checkHashPackAvailability()
  }

  // Connect to HashPack via WalletConnect or extension
  async connect(): Promise<boolean> {
    try {
      // Try to connect to HashPack extension first
      if (typeof window !== 'undefined') {
        const hashpack = (window as any).hashpack
        if (hashpack) {
          const result = await hashpack.connect()
          if (result.success) {
            this.accounts = result.accounts || []
            this.isConnectedState = true
            return true
          }
        }
      }
      
      // Fallback to WalletConnect for mobile HashPack
      console.log("HashPack extension not found, use WalletConnect QR code")
      return false
    } catch (error) {
      console.error("Failed to connect to HashPack:", error)
      return false
    }
  }

  // Get account info
  getAccountIds(): string[] {
    return this.accounts.map(acc => acc.accountId)
  }

  // Get primary account
  getPrimaryAccount(): string | null {
    return this.accounts.length > 0 ? this.accounts[0].accountId : null
  }

  // Check if connected
  isConnected(): boolean {
    return this.isConnectedState && this.accounts.length > 0
  }

  // Disconnect
  async disconnect(): Promise<void> {
    this.accounts = []
    this.isConnectedState = false
    
    if (typeof window !== 'undefined') {
      const hashpack = (window as any).hashpack
      if (hashpack && hashpack.disconnect) {
        await hashpack.disconnect()
      }
    }
  }

  // Send transaction
  async sendTransaction(transaction: any): Promise<any> {
    if (!this.isConnected()) {
      throw new Error("HashPack not connected")
    }

    const accountId = this.getPrimaryAccount()
    if (!accountId) {
      throw new Error("No account available")
    }

    if (typeof window !== 'undefined') {
      const hashpack = (window as any).hashpack
      if (hashpack && hashpack.sendTransaction) {
        return await hashpack.sendTransaction(accountId, transaction)
      }
    }

    throw new Error("HashPack not available")
  }

  // Sign message
  async signMessage(message: string): Promise<any> {
    if (!this.isConnected()) {
      throw new Error("HashPack not connected")
    }

    const accountId = this.getPrimaryAccount()
    if (!accountId) {
      throw new Error("No account available")
    }

    if (typeof window !== 'undefined') {
      const hashpack = (window as any).hashpack
      if (hashpack && hashpack.signMessage) {
        return await hashpack.signMessage(accountId, message)
      }
    }

    throw new Error("HashPack not available")
  }
}

// Create singleton instance
export const hashPackWallet = new HashPackWallet()