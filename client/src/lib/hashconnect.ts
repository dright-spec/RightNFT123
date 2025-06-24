// src/lib/hashconnect.ts
import { HashConnect, HashConnectTypes } from "@hashgraph/hashconnect";
import { Client, AccountId } from "@hashgraph/sdk";

const APP_METADATA: HashConnectTypes.AppMetadata = {
  name: "Dright – Rights Marketplace",
  description: "Hedera NFT marketplace for tokenizing legal rights",
  icon: window.location.origin + "/favicon.ico",
  url: window.location.origin,
};
const NETWORK = "testnet";  // change to "mainnet" when you go live

let hashconnect: HashConnect;
let topic: string;
let accountIds: string[] = [];
let pairingData: HashConnectTypes.SavedPairingData;

export async function initializeHashConnect(): Promise<void> {
  if (hashconnect) return;

  try {
    hashconnect = new HashConnect();
    const initData = await hashconnect.init(APP_METADATA, NETWORK);
    pairingData = initData.pairingData;
    topic = initData.topic;
    
    // Log initialization success
    console.log('HashConnect initialized successfully', { topic, pairingData });

    // listen for when a wallet approves
    if (hashconnect.foundExtension) {
      hashconnect.foundExtension.subscribe((ext) => {
        console.info("Found wallet extension:", ext.metadata.name);
      });
    }

    if (hashconnect.pairingEvent) {
      hashconnect.pairingEvent.subscribe((pairing) => {
        accountIds = pairing.accountIds;
        topic = pairing.topic;
        console.info("Paired to wallet:", pairing.metadata.name, accountIds);
      });
    }
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
      
      // Try to connect to local wallet extensions
      if (hashconnect && hashconnect.pairableData && hashconnect.pairableData.length > 0) {
        hashconnect.pairableData.forEach(pd => {
          try {
            hashconnect.connectToLocalWallet(pd.topic);
          } catch (error) {
            console.warn('Error connecting to local wallet:', error);
          }
        });
      } else {
        // Fallback: trigger pairing modal
        try {
          hashconnect.connectToLocalWallet(topic);
        } catch (error) {
          console.warn('Error opening pairing modal:', error);
        }
      }
      
      // Wait for user approval with timeout
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout - please ensure HashPack is installed and unlocked'));
        }, 30000); // 30 second timeout
        
        if (hashconnect && hashconnect.pairingEvent) {
          const sub = hashconnect.pairingEvent.subscribe(() => { 
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
      throw new Error('No account connected - please try again');
    }
    
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