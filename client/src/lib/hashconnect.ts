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

  hashconnect = new HashConnect();
  const initData = await hashconnect.init(APP_METADATA, NETWORK);
  pairingData = initData.pairingData;
  topic = initData.topic;
  
  // Log initialization success
  console.log('HashConnect initialized successfully', { topic, pairingData });

  // listen for when a wallet approves
  hashconnect.foundExtension!.subscribe((ext) => {
    console.info("Found wallet extension:", ext.metadata.name);
  });

  hashconnect.pairingEvent!.subscribe((pairing) => {
    accountIds = pairing.accountIds;
    topic = pairing.topic;
    console.info("Paired to wallet:", pairing.metadata.name, accountIds);
  });
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
  await initializeHashConnect();
  
  if (!accountIds.length) {
    console.log('Opening HashPack wallet connection...');
    
    // Try to connect to local wallet extensions
    if (hashconnect.pairableData.length > 0) {
      hashconnect.pairableData.forEach(pd => {
        hashconnect.connectToLocalWallet(pd.topic);
      });
    } else {
      // Fallback: trigger pairing modal
      hashconnect.connectToLocalWallet(topic);
    }
    
    // Wait for user approval with timeout
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout - please ensure HashPack is installed and unlocked'));
      }, 30000); // 30 second timeout
      
      const sub = hashconnect
        .pairingEvent!
        .subscribe(() => { 
          clearTimeout(timeout);
          sub.unsubscribe(); 
          resolve(); 
        });
    });
  }
  
  if (!accountIds.length) {
    throw new Error('No account connected - please try again');
  }
  
  return accountIds[0];
}

export async function disconnectWallet(): Promise<void> {
  if (!topic) return;
  hashconnect.disconnect(topic);
  accountIds = [];
  topic = "";
}

export function isConnected(): boolean {
  return accountIds.length > 0;
}

export function getConnectedAccountIds(): string[] {
  return [...accountIds];
}