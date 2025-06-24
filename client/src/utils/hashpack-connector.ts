// Direct HashPack connection using HashConnect library
import { HashConnect, HashConnectTypes, MessageTypes } from '@hashgraph/hashconnect';

export class HashPackConnector {
  private hashConnect: HashConnect;
  private appMetadata: HashConnectTypes.AppMetadata = {
    name: "Dright Marketplace",
    description: "Hedera Rights Marketplace",
    icon: window.location.origin + "/favicon.ico",
    url: window.location.origin
  };
  
  constructor() {
    this.hashConnect = new HashConnect(true); // Enable debug logging
  }

  async initializeAndConnect(): Promise<string> {
    try {
      console.log('Initializing HashConnect...');
      
      // Initialize HashConnect
      await this.hashConnect.init(this.appMetadata);
      console.log('HashConnect initialized successfully');

      // Get available extensions
      const extensions = this.hashConnect.foundExtensionEvent;
      console.log('Available extensions:', extensions);

      // Try to pair with HashPack
      console.log('Attempting to pair with HashPack...');
      
      // Find HashPack extension
      const hashpackExtension = this.hashConnect.findLocalWallets().find(
        wallet => wallet.name.toLowerCase().includes('hashpack')
      );
      
      if (!hashpackExtension) {
        throw new Error('HashPack extension not found in available wallets');
      }
      
      console.log('Found HashPack extension:', hashpackExtension);
      
      // Connect to HashPack
      const pairing = await this.hashConnect.connectToLocalWallet();
      console.log('Pairing result:', pairing);
      
      if (pairing && pairing.accountIds && pairing.accountIds.length > 0) {
        const accountId = pairing.accountIds[0];
        console.log('Successfully connected to HashPack account:', accountId);
        return accountId;
      } else {
        throw new Error('No account IDs received from HashPack');
      }
      
    } catch (error) {
      console.error('HashPack connection failed:', error);
      throw new Error(`HashPack connection failed: ${error.message}`);
    }
  }

  async connectViaLegacyAPI(): Promise<string> {
    try {
      console.log('Attempting legacy HashPack API connection...');
      
      // Wait for HashPack to be available
      let attempts = 0;
      const maxAttempts = 10;
      
      while (attempts < maxAttempts) {
        if ((window as any).hashpack) {
          console.log('HashPack API found, attempting connection...');
          
          const result = await (window as any).hashpack.requestAccountInfo();
          console.log('HashPack legacy API result:', result);
          
          if (result && result.accountId) {
            return result.accountId;
          } else {
            throw new Error('No account ID in HashPack response');
          }
        }
        
        console.log(`HashPack not found, attempt ${attempts + 1}/${maxAttempts}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }
      
      throw new Error('HashPack API not available after waiting');
      
    } catch (error) {
      console.error('Legacy HashPack connection failed:', error);
      throw error;
    }
  }

  async connect(): Promise<string> {
    console.log('Starting HashPack connection process...');
    
    try {
      // First try the official HashConnect method
      return await this.initializeAndConnect();
    } catch (error) {
      console.log('HashConnect method failed, trying legacy API...');
      
      try {
        // Fallback to legacy API
        return await this.connectViaLegacyAPI();
      } catch (legacyError) {
        console.error('Both connection methods failed');
        throw new Error(
          `HashPack connection failed. ` +
          `HashConnect: ${error.message}. ` +
          `Legacy API: ${legacyError.message}`
        );
      }
    }
  }
}