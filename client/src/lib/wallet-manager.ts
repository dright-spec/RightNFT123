// Ethereum wallet manager with MetaMask and WalletConnect support
export interface WalletInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  isAvailable: boolean;
  isRecommended?: boolean;
  isEthereumNative?: boolean;
  downloadUrl?: string;
}

export interface ConnectedWallet {
  walletId: string;
  address: string;
  isConnected: boolean;
}

// Detect available Ethereum wallets
export async function detectAvailableWallets(): Promise<WalletInfo[]> {
  const wallets: WalletInfo[] = [];

  // MetaMask detection
  const hasMetaMask = !!(window as any).ethereum?.isMetaMask;
  wallets.push({
    id: "metamask",
    name: "MetaMask",
    description: "Popular Ethereum wallet with extensive dApp support",
    icon: "🦊",
    isAvailable: hasMetaMask,
    isRecommended: true,
    isEthereumNative: true,
    downloadUrl: "https://metamask.io/download/",
  });

  // WalletConnect
  wallets.push({
    id: "walletconnect",
    name: "WalletConnect",
    description: "Connect to mobile wallets via QR code",
    icon: "🔗",
    isAvailable: true,
    isRecommended: false,
    isEthereumNative: true,
    downloadUrl: "https://walletconnect.com/",
  });

  // Coinbase Wallet
  const hasCoinbase = !!(window as any).ethereum?.isCoinbaseWallet;
  wallets.push({
    id: "coinbase",
    name: "Coinbase Wallet",
    description: "Connect with Coinbase Wallet",
    icon: "🟦",
    isAvailable: hasCoinbase,
    isRecommended: false,
    isEthereumNative: true,
    downloadUrl: "https://www.coinbase.com/wallet",
  });

  console.log('Detected Ethereum wallets:', wallets);
  return wallets;
}

// Connect to a specific wallet
export async function connectToWallet(walletId: string): Promise<string> {
  console.log(`Connecting to ${walletId}...`);

  switch (walletId) {
    case "metamask":
      return await connectMetaMask();
    case "walletconnect":
      return await connectWalletConnect();
    case "coinbase":
      return await connectCoinbase();
    default:
      throw new Error(`Unsupported wallet: ${walletId}`);
  }
}

// MetaMask connection
async function connectMetaMask(): Promise<string> {
  if (!(window as any).ethereum?.isMetaMask) {
    throw new Error("MetaMask not installed");
  }

  try {
    const accounts = await (window as any).ethereum.request({
      method: "eth_requestAccounts",
    });

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found");
    }

    // Switch to Ethereum mainnet if needed
    try {
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x1" }], // Ethereum mainnet
      });
    } catch (switchError: any) {
      // Chain doesn't exist, add it
      if (switchError.code === 4902) {
        await (window as any).ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: "0x1",
              chainName: "Ethereum Mainnet",
              nativeCurrency: {
                name: "Ether",
                symbol: "ETH",
                decimals: 18,
              },
              rpcUrls: ["https://mainnet.infura.io/v3/"],
              blockExplorerUrls: ["https://etherscan.io/"],
            },
          ],
        });
      }
    }

    return accounts[0];
  } catch (error: any) {
    throw new Error(`MetaMask connection failed: ${error.message}`);
  }
}

// WalletConnect connection
async function connectWalletConnect(): Promise<string> {
  try {
    // For now, we'll use a simple modal approach
    // In a production app, you'd integrate with WalletConnect SDK
    throw new Error("WalletConnect integration coming soon");
  } catch (error: any) {
    throw new Error(`WalletConnect connection failed: ${error.message}`);
  }
}

// Coinbase Wallet connection
async function connectCoinbase(): Promise<string> {
  if (!(window as any).ethereum?.isCoinbaseWallet) {
    throw new Error("Coinbase Wallet not installed");
  }

  try {
    const accounts = await (window as any).ethereum.request({
      method: "eth_requestAccounts",
    });

    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found");
    }

    return accounts[0];
  } catch (error: any) {
    throw new Error(`Coinbase Wallet connection failed: ${error.message}`);
  }
}

// Get connected wallet info
export function getConnectedWallet(): ConnectedWallet | null {
  if ((window as any).ethereum && (window as any).ethereum.selectedAddress) {
    return {
      walletId: "metamask",
      address: (window as any).ethereum.selectedAddress,
      isConnected: true,
    };
  }
  return null;
}

// Disconnect wallet
export async function disconnectWallet(): Promise<void> {
  // MetaMask doesn't have a disconnect method
  // Users need to disconnect from their wallet directly
  console.log("Please disconnect from your wallet directly");
}