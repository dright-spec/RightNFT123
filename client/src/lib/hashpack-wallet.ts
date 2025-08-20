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
    if (typeof window === 'undefined') return false
    
    const windowObj = window as any
    
    // Check multiple possible HashPack objects
    const hashPackObjects = [
      windowObj.hashpack,
      windowObj.HashPack,
      windowObj.hashconnect,
      windowObj.HashConnect,
      windowObj.hc,
      // Check if ethereum provider is HashPack
      windowObj.ethereum?.isHashPack ? windowObj.ethereum : null,
      // Check for HashPack specific methods on ethereum object
      windowObj.ethereum?.hashpack,
    ]
    
    for (const obj of hashPackObjects) {
      if (obj && typeof obj === 'object') {
        console.log("HashPack-like object found:", obj)
        return true
      }
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
      if (typeof window === 'undefined') return false
      
      const windowObj = window as any
      
      // Try different HashPack connection methods
      const connectionMethods = [
        // Method 1: Direct hashpack object
        async () => {
          const hashpack = windowObj.hashpack
          if (hashpack && hashpack.connect) {
            const result = await hashpack.connect()
            return result?.success ? { accounts: result.accounts } : null
          }
          return null
        },
        
        // Method 2: HashConnect method
        async () => {
          const hashconnect = windowObj.hashconnect || windowObj.HashConnect
          if (hashconnect && hashconnect.connect) {
            const result = await hashconnect.connect()
            return result?.success ? { accounts: result.accounts } : null
          }
          return null
        },
        
        // Method 3: Ethereum provider with HashPack identification
        async () => {
          const ethereum = windowObj.ethereum
          if (ethereum && (ethereum.isHashPack || ethereum.hashpack)) {
            const accounts = await ethereum.request({ method: 'eth_requestAccounts' })
            return accounts?.length > 0 ? { accounts: accounts.map((acc: string) => ({ accountId: acc })) } : null
          }
          return null
        }
      ]
      
      for (const method of connectionMethods) {
        try {
          const result = await method()
          if (result && result.accounts?.length > 0) {
            this.accounts = result.accounts
            this.isConnectedState = true
            console.log("HashPack connected successfully:", result.accounts)
            return true
          }
        } catch (methodError) {
          console.log("Connection method failed:", methodError)
          continue
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