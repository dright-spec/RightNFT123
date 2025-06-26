// src/lib/hashconnect.ts
import { HashConnect, HashConnectTypes } from "@hashgraph/hashconnect";
import { Client, AccountId } from "@hashgraph/sdk";

const APP_METADATA: HashConnectTypes.AppMetadata = {
  name: "Dright – Rights Marketplace",
  description: "Hedera NFT marketplace for tokenizing legal rights",
  icon: window.location.origin + "/favicon.ico",
  url: window.location.origin,
};

const PROJECT_ID = "dright-rights-marketplace";
const NETWORK = "testnet";  // change to "mainnet" when you go live

let hashconnect: HashConnect;
let topic: string;
let accountIds: string[] = [];
let savedPairingData: HashConnectTypes.SavedPairingData[] = [];

export async function initializeHashConnect(): Promise<void> {
  if (hashconnect) return;

  try {
    // v2 syntax with proper project metadata
    hashconnect = new HashConnect();
    const initData = await hashconnect.init(APP_METADATA, NETWORK, true);
    topic = initData.topic;
    
    // Listen for extension discovery
    hashconnect.foundExtensionEvent.once((walletMetadata) => {
      console.log('🔍 Found HashPack extension:', walletMetadata);
    });

    // Listen for pairing approval
    hashconnect.pairingEvent.once((pairingData) => {
      console.log('HashConnect paired:', pairingData);
      accountIds = pairingData.accountIds || [];
    });
  } catch (error) {
    console.error('Failed to initialize HashConnect:', error);
    throw error;
  }
}

export function getAccountId(): AccountId | null {
  return accountIds.length ? AccountId.fromString(accountIds[0]) : null;
}

export function getClient(): Client | null {
  const acc = getAccountId();
  if (!acc) return null;
  const client = Client.forTestnet();    // or forMainnet()
  // Note: For user wallets, we don't set operator key - that's for server operations
  return client;
}

export async function connectWallet(): Promise<string> {
  try {
    await initializeHashConnect();
    
    if (!accountIds.length) {
      console.log('Opening HashPack wallet connection...');
      
      // Check if we have pairable data (local wallets)
      if (hashconnect && hashconnect.pairableData && hashconnect.pairableData.length > 0) {
        console.log('Found local wallet extensions, attempting connection...');
        hashconnect.pairableData.forEach(pd => {
          try {
            hashconnect.connectToLocalWallet(pd.topic);
          } catch (error) {
            console.warn('Error connecting to local wallet:', error);
          }
        });
      } else {
        console.log('No local wallets found, opening pairing interface...');
        // Open the pairing interface for QR code connection
        try {
          hashconnect.openRequestedPairing();
        } catch (error) {
          console.warn('Error opening pairing interface:', error);
          // Fallback to connectToLocalWallet
          hashconnect.connectToLocalWallet(topic);
        }
      }
      
      // Wait for user approval with timeout
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout - please ensure HashPack is installed and try pairing via QR code'));
        }, 45000); // 45 second timeout for QR code pairing
        
        if (hashconnect && hashconnect.pairingEvent) {
          const sub = hashconnect.pairingEvent.subscribe((pairingData) => { 
            console.log('Pairing successful:', pairingData);
            clearTimeout(timeout);
            sub.unsubscribe(); 
            resolve(); 
          });
        } else {
          clearTimeout(timeout);
          reject(new Error('HashConnect pairing event not available'));
        }
      });
    }
    
    if (!accountIds.length) {
      throw new Error('No account connected after pairing - please check HashPack wallet');
    }
    
    console.log('✅ HashConnect connection successful:', accountIds[0]);
    return accountIds[0];
  } catch (error) {
    console.error('HashConnect wallet connection failed:', error);
    throw error;
  }
}

export async function disconnectWallet(): Promise<void> {
  if (!topic) return;
  hashconnect.disconnect(topic);
  accountIds = [];
  topic = "";
}

export function isConnected(): boolean {
  try {
    return accountIds.length > 0;
  } catch (error) {
    return false;
  }
}

export function getConnectedAccountIds(): string[] {
  try {
    return [...accountIds];
  } catch (error) {
    return [];
  }
}