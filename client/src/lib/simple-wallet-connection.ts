// Simplified wallet connection for testnet development
export class SimpleWalletConnection {
  private provider: any = null;
  private signer: any = null;
  private isConnected = false;
  
  constructor() {
    this.checkWalletAvailability();
  }

  private checkWalletAvailability() {
    if (typeof window !== 'undefined') {
      this.provider = (window as any).ethereum;
    }
  }

  async connectWallet() {
    if (!this.provider) {
      throw new Error('No wallet provider found. Please install MetaMask or another Web3 wallet.');
    }

    try {
      // Request account access
      const accounts = await this.provider.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Get network information
      const chainId = await this.provider.request({
        method: 'eth_chainId'
      });

      // Get balance
      const balance = await this.provider.request({
        method: 'eth_getBalance',
        params: [accounts[0], 'latest']
      });

      this.isConnected = true;

      return {
        address: accounts[0],
        chainId: parseInt(chainId, 16),
        balance: this.formatBalance(balance),
        isTestnet: this.isTestnetChain(parseInt(chainId, 16))
      };
    } catch (error) {
      console.error('Wallet connection failed:', error);
      throw error;
    }
  }

  async switchToLocalNetwork() {
    if (!this.provider) {
      throw new Error('No wallet provider found');
    }

    try {
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x539' }], // 1337 in hex
      });
    } catch (switchError: any) {
      // If the network doesn't exist, add it
      if (switchError.code === 4902) {
        await this.provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: '0x539',
              chainName: 'Hardhat Local',
              rpcUrls: ['http://127.0.0.1:8545'],
              nativeCurrency: {
                name: 'ETH',
                symbol: 'ETH',
                decimals: 18,
              },
            },
          ],
        });
      } else {
        throw switchError;
      }
    }
  }

  async sendTransaction(to: string, value: string, data?: string) {
    if (!this.provider || !this.isConnected) {
      throw new Error('Wallet not connected');
    }

    const accounts = await this.provider.request({
      method: 'eth_accounts'
    });

    if (accounts.length === 0) {
      throw new Error('No accounts available');
    }

    const txParams: any = {
      from: accounts[0],
      to: to,
      value: this.parseEther(value),
    };

    if (data) {
      txParams.data = data;
    }

    try {
      const txHash = await this.provider.request({
        method: 'eth_sendTransaction',
        params: [txParams],
      });

      return txHash;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    }
  }

  // Utility functions
  private formatBalance(balanceHex: string): string {
    const balanceWei = parseInt(balanceHex, 16);
    const balanceEth = balanceWei / Math.pow(10, 18);
    return balanceEth.toFixed(4);
  }

  private parseEther(value: string): string {
    const valueWei = parseFloat(value) * Math.pow(10, 18);
    return '0x' + Math.floor(valueWei).toString(16);
  }

  private isTestnetChain(chainId: number): boolean {
    const testnetChains = [1337, 11155111, 80001, 5]; // Hardhat, Sepolia, Mumbai, Goerli
    return testnetChains.includes(chainId);
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      hasProvider: !!this.provider
    };
  }

  async getAccounts() {
    if (!this.provider) {
      return [];
    }

    try {
      return await this.provider.request({
        method: 'eth_accounts'
      });
    } catch (error) {
      console.error('Failed to get accounts:', error);
      return [];
    }
  }
}

// Export singleton instance
export const simpleWallet = new SimpleWalletConnection();