// HashPack dApp Connection Service
// Uses HashPack's official dApp connection protocol

interface HashPackDAppMetadata {
  name: string;
  description: string;
  icons: string[];
  url: string;
}

interface HashPackConnectionResult {
  accountIds: string[];
  network: string;
  topic: string;
}

class HashPackDAppService {
  private isConnected = false;
  private accountId: string | null = null;
  private topic: string | null = null;
  private network: string = 'testnet';

  // Generate a unique pairing string for HashPack dApp connection
  private generatePairingString(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    return `dright-${timestamp}-${random}`;
  }

  // Initialize HashPack dApp connection
  async connectDApp(): Promise<string> {
    console.log('Initializing HashPack dApp connection...');

    // Check if HashConnect is available (HashPack's connection library)
    const hashConnect = (window as any).hashconnect;
    if (!hashConnect) {
      throw new Error('HashConnect not available. Please ensure HashPack is installed and updated.');
    }

    try {
      // App metadata for HashPack
      const appMetadata: HashPackDAppMetadata = {
        name: "Dright",
        description: "Legal Rights Marketplace - Trade intellectual property as NFTs",
        icons: [`${window.location.origin}/favicon.ico`],
        url: window.location.origin
      };

      // Generate pairing data
      const pairingString = this.generatePairingString();
      console.log('Generated pairing string:', pairingString);

      // Initialize HashConnect
      const hashConnectInstance = new hashConnect.HashConnect(
        true, // Use testnet
        appMetadata,
        false // Don't auto-pair
      );

      // Create pairing
      const pairingData = await hashConnectInstance.init();
      console.log('HashConnect initialized:', pairingData);

      // Set up event listeners
      hashConnectInstance.pairingEvent.on((pairingData: any) => {
        console.log('Pairing event received:', pairingData);
        this.handlePairingSuccess(pairingData);
      });

      hashConnectInstance.connectionStatusChangeEvent.on((status: any) => {
        console.log('Connection status changed:', status);
      });

      // Generate pairing QR code or direct connection
      const pairingString = hashConnectInstance.generatePairingString(
        pairingData,
        "testnet",
        false
      );

      // Try direct connection first
      console.log('Attempting direct HashPack connection...');
      
      // Check if HashPack extension is available for direct connection
      if ((window as any).hashpack && (window as any).hashpack.connectToExtension) {
        try {
          const result = await (window as any).hashpack.connectToExtension();
          if (result && result.accountIds && result.accountIds.length > 0) {
            this.accountId = result.accountIds[0];
            this.network = result.network || 'testnet';
            this.isConnected = true;
            console.log('Direct HashPack connection successful:', this.accountId);
            return this.accountId;
          }
        } catch (directError) {
          console.log('Direct connection failed, trying pairing:', directError);
        }
      }

      // If direct connection fails, show pairing instructions
      this.showPairingInstructions(pairingString);

      // Wait for pairing completion
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout. Please try again.'));
        }, 60000); // 1 minute timeout

        hashConnectInstance.pairingEvent.once((data: any) => {
          clearTimeout(timeout);
          if (data && data.accountIds && data.accountIds.length > 0) {
            this.accountId = data.accountIds[0];
            this.network = data.network || 'testnet';
            this.isConnected = true;
            this.topic = data.topic;
            resolve(this.accountId);
          } else {
            reject(new Error('No accounts found in HashPack wallet.'));
          }
        });
      });

    } catch (error) {
      console.error('HashPack dApp connection error:', error);
      throw new Error('Failed to connect to HashPack. Please ensure the wallet is unlocked and try again.');
    }
  }

  private handlePairingSuccess(pairingData: any) {
    console.log('HashPack pairing successful:', pairingData);
    this.isConnected = true;
    this.topic = pairingData.topic;
  }

  private showPairingInstructions(pairingString: string) {
    console.log('To connect with HashPack:');
    console.log('1. Open HashPack wallet');
    console.log('2. Go to "Connect to dApp"');
    console.log('3. Scan QR code or enter pairing string:', pairingString);
    
    // You could also display this in the UI
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('hashpack-pairing', {
        detail: { pairingString }
      });
      window.dispatchEvent(event);
    }
  }

  // Alternative connection method using window.open
  async connectViaWindow(): Promise<string> {
    console.log('Attempting HashPack connection via window...');
    
    try {
      // Create connection URL
      const connectionUrl = `https://hashpack.app/connect?` + new URLSearchParams({
        origin: window.location.origin,
        name: 'Dright',
        description: 'Legal Rights Marketplace',
        network: 'testnet'
      }).toString();

      // Open HashPack in new window
      const popup = window.open(
        connectionUrl,
        'hashpack-connect',
        'width=400,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        throw new Error('Popup blocked. Please allow popups for this site.');
      }

      // Listen for connection result
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          popup.close();
          reject(new Error('Connection timeout'));
        }, 60000);

        // Listen for messages from popup
        const messageHandler = (event: MessageEvent) => {
          if (event.origin !== 'https://hashpack.app') return;
          
          clearTimeout(timeout);
          window.removeEventListener('message', messageHandler);
          popup.close();

          if (event.data.type === 'HASHPACK_CONNECTION_SUCCESS') {
            this.accountId = event.data.accountId;
            this.network = event.data.network || 'testnet';
            this.isConnected = true;
            resolve(this.accountId);
          } else {
            reject(new Error('Connection failed or cancelled'));
          }
        };

        window.addEventListener('message', messageHandler);

        // Check if popup was closed manually
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            clearTimeout(timeout);
            window.removeEventListener('message', messageHandler);
            reject(new Error('Connection cancelled'));
          }
        }, 1000);
      });

    } catch (error) {
      console.error('Window connection error:', error);
      throw error;
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      accountId: this.accountId,
      network: this.network,
      topic: this.topic
    };
  }

  disconnect() {
    this.isConnected = false;
    this.accountId = null;
    this.topic = null;
    console.log('HashPack disconnected');
  }
}

export const hashPackDApp = new HashPackDAppService();