// Proper HashConnect initialization and management
// This handles the complete HashConnect lifecycle for Hedera wallet connections

import { HashConnect, HashConnectTypes, MessageTypes } from '@hashgraph/hashconnect';

export interface HashConnectState {
  isInitialized: boolean;
  isConnected: boolean;
  accountId: string | null;
  network: 'testnet' | 'mainnet';
  topic: string | null;
  pairingString: string | null;
  error: string | null;
}

class HashConnectService {
  private hashconnect: HashConnect | null = null;
  private state: HashConnectState = {
    isInitialized: false,
    isConnected: false,
    accountId: null,
    network: 'testnet',
    topic: null,
    pairingString: null,
    error: null
  };
  private eventHandlers: Map<string, Function[]> = new Map();

  async initialize(): Promise<boolean> {
    console.log('=== Initializing HashConnect ===');
    
    try {
      // Check if HashPack extension is actually installed
      if (typeof window !== 'undefined') {
        const hasExtension = !!(window as any).hashconnect || 
                            !!(window as any).HashConnect ||
                            document.querySelector('script[src*="hashpack"]') ||
                            document.querySelector('meta[name*="hashpack"]');
        
        if (!hasExtension) {
          console.warn('HashPack extension not detected. User should install HashPack wallet extension.');
          this.state.error = 'HashPack extension not found. Please install HashPack wallet extension.';
          return false;
        }
        
        console.log('HashPack extension detected, proceeding with connection...');
      }

      // Create HashConnect instance
      this.hashconnect = new HashConnect(
        process.env.NODE_ENV === 'development' // LedgerWorks flag for development
      );

      // Set up event listeners before initialization
      this.setupEventListeners();

      // Initialize HashConnect
      console.log('Calling hashconnect.init()...');
      const initData = await this.hashconnect.init(
        {
          name: 'Dright Marketplace',
          description: 'Legal Rights NFT Marketplace on Hedera',
          url: window.location.origin,
          icon: `${window.location.origin}/favicon.ico`
        },
        'testnet', // network
        false // debug
      );

      console.log('HashConnect initialization successful:', initData);
      
      this.state.isInitialized = true;
      this.state.topic = initData.topic;
      this.state.error = null;

      // Generate pairing string
      this.generatePairingString();

      // Check for existing connection
      await this.checkExistingConnection();

      this.emit('initialized', this.state);
      return true;

    } catch (error) {
      console.error('HashConnect initialization failed:', error);
      this.state.error = error instanceof Error ? error.message : 'Initialization failed';
      this.emit('error', this.state);
      return false;
    }
  }

  private setupEventListeners() {
    if (!this.hashconnect) return;

    console.log('Setting up HashConnect event listeners...');

    // Connection status change events
    this.hashconnect.connectionStatusChangeEvent.on((connectionStatus) => {
      console.log('HashConnect connection status changed:', connectionStatus);
      this.handleConnectionStatusChange(connectionStatus);
    });

    // Pairing events
    this.hashconnect.pairingEvent.on((pairingData) => {
      console.log('HashConnect pairing event:', pairingData);
      this.handlePairingEvent(pairingData);
    });

    // Found extension events
    this.hashconnect.foundExtensionEvent.on((walletMetadata) => {
      console.log('HashConnect found extension:', walletMetadata);
      this.emit('extensionFound', walletMetadata);
    });

    // Additional events
    this.hashconnect.foundIframeEvent.on((iframeData) => {
      console.log('HashConnect found iframe:', iframeData);
    });
  }

  private handleConnectionStatusChange(connectionStatus: any) {
    console.log('Processing connection status change:', connectionStatus);
    
    // Check if connected (status is usually a string like 'Connected' or boolean)
    this.state.isConnected = connectionStatus === 'Connected' || connectionStatus === true;
    
    if (this.state.isConnected) {
      console.log('HashConnect successfully connected');
      this.state.error = null;
    } else {
      console.log('HashConnect disconnected');
      this.state.accountId = null;
    }

    this.emit('connectionChange', this.state);
  }

  private handlePairingEvent(pairingData: MessageTypes.ApprovePairing) {
    console.log('Processing pairing event:', pairingData);
    
    if (pairingData.accountIds && pairingData.accountIds.length > 0) {
      this.state.accountId = pairingData.accountIds[0];
      this.state.network = pairingData.network === 'mainnet' ? 'mainnet' : 'testnet';
      this.state.isConnected = true;
      this.state.error = null;
      
      console.log(`Wallet paired successfully: ${this.state.accountId} on ${this.state.network}`);
      
      // Store connection data for persistence
      this.saveConnectionData(pairingData);
      
      this.emit('paired', this.state);
    }
  }

  private generatePairingString() {
    if (!this.hashconnect || !this.state.topic) return;

    try {
      console.log('Generating pairing string...');
      this.state.pairingString = this.hashconnect.generatePairingString(
        this.state.topic,
        this.state.network,
        false // debug flag
      );
      
      console.log('Pairing string generated:', this.state.pairingString);
      this.emit('pairingStringGenerated', this.state);
    } catch (error) {
      console.error('Failed to generate pairing string:', error);
      this.state.error = 'Failed to generate pairing string';
    }
  }

  private async checkExistingConnection() {
    if (!this.hashconnect) return;

    try {
      console.log('Checking for existing HashConnect connection...');
      
      // Check saved connection data
      const savedData = this.loadConnectionData();
      if (savedData && savedData.accountIds && savedData.accountIds.length > 0) {
        console.log('Found existing connection data:', savedData);
        
        this.state.accountId = savedData.accountIds[0];
        this.state.network = savedData.network === 'mainnet' ? 'mainnet' : 'testnet';
        this.state.isConnected = true;
        
        this.emit('reconnected', this.state);
      }
    } catch (error) {
      console.log('No existing connection found:', error);
    }
  }

  async connectWallet(): Promise<string | null> {
    console.log('=== Starting HashConnect Wallet Connection ===');
    
    if (!this.state.isInitialized) {
      console.log('HashConnect not initialized, initializing now...');
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize HashConnect');
      }
    }

    if (this.state.isConnected && this.state.accountId) {
      console.log('Already connected to wallet:', this.state.accountId);
      return this.state.accountId;
    }

    try {
      console.log('Requesting wallet connection...');
      console.log('Pairing string:', this.state.pairingString);
      
      if (!this.state.pairingString) {
        throw new Error('No pairing string available. Please refresh and try again.');
      }

      // The actual connection happens when user scans QR code or opens pairing string
      // For now, return the pairing string so UI can display it
      return this.state.pairingString;

    } catch (error) {
      console.error('Wallet connection failed:', error);
      this.state.error = error instanceof Error ? error.message : 'Connection failed';
      this.emit('error', this.state);
      throw error;
    }
  }

  async disconnectWallet(): Promise<void> {
    console.log('Disconnecting HashConnect wallet...');
    
    if (this.hashconnect && this.state.isConnected) {
      try {
        await this.hashconnect.disconnect();
        this.clearConnectionData();
        
        this.state.isConnected = false;
        this.state.accountId = null;
        this.state.error = null;
        
        console.log('Wallet disconnected successfully');
        this.emit('disconnected', this.state);
      } catch (error) {
        console.error('Disconnect error:', error);
        this.state.error = 'Failed to disconnect';
        this.emit('error', this.state);
      }
    }
  }

  private saveConnectionData(pairingData: MessageTypes.ApprovePairing) {
    try {
      localStorage.setItem('hashconnect_data', JSON.stringify({
        accountIds: pairingData.accountIds,
        network: pairingData.network,
        topic: this.state.topic,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.log('Failed to save connection data:', error);
    }
  }

  private loadConnectionData(): any {
    try {
      const saved = localStorage.getItem('hashconnect_data');
      if (saved) {
        const data = JSON.parse(saved);
        // Check if data is not too old (24 hours)
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          return data;
        }
      }
    } catch (error) {
      console.log('Failed to load connection data:', error);
    }
    return null;
  }

  private clearConnectionData() {
    try {
      localStorage.removeItem('hashconnect_data');
    } catch (error) {
      console.log('Failed to clear connection data:', error);
    }
  }

  // Event system
  on(event: string, handler: Function) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: Function) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private emit(event: string, data: any) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // Getters
  getState(): HashConnectState {
    return { ...this.state };
  }

  isInitialized(): boolean {
    return this.state.isInitialized;
  }

  isConnected(): boolean {
    return this.state.isConnected;
  }

  getAccountId(): string | null {
    return this.state.accountId;
  }

  getPairingString(): string | null {
    return this.state.pairingString;
  }

  getNetwork(): 'testnet' | 'mainnet' {
    return this.state.network;
  }

  // Network configuration
  setNetwork(network: 'testnet' | 'mainnet') {
    console.log(`Setting HashConnect network to: ${network}`);
    this.state.network = network;
    
    // If initialized, regenerate pairing string for new network
    if (this.state.isInitialized && this.hashconnect) {
      this.generatePairingString();
    }
  }

  // Transaction signing (for future use)
  async signTransaction(transaction: any): Promise<any> {
    if (!this.hashconnect || !this.state.isConnected) {
      throw new Error('HashConnect not connected');
    }

    try {
      console.log('Signing transaction with HashConnect...');
      const response = await this.hashconnect.sendTransaction(this.state.topic!, transaction);
      console.log('Transaction signed:', response);
      return response;
    } catch (error) {
      console.error('Transaction signing failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const hashConnectService = new HashConnectService();