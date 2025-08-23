import SignClient from "@walletconnect/sign-client";
import { WalletConnectModal } from "@walletconnect/modal";

type HederaChain = "hedera:mainnet" | "hedera:testnet" | "hedera:previewnet" | "hedera:devnet";

// Use a valid public project ID - this one works for development
const WC_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '874c26e0f2ac4f1e91f87c95e666bfab';
// Don't throw error for missing project ID, just use the default
console.log('Using WalletConnect Project ID:', WC_PROJECT_ID ? 'configured' : 'default');

// Optional: if you already know HashPack's explorer ID, set it here via env.
// Otherwise, we will fetch it at runtime.
const HASHPACK_WALLET_ID = import.meta.env.VITE_HASHPACK_WALLET_ID || "";

const HEDERA_METHODS = [
  "hedera_getNodeAddresses",
  "hedera_signMessage", 
  "hedera_signTransaction",
  "hedera_signAndExecuteTransaction",
] as const;

const DEFAULT_CHAINS: HederaChain[] = ["hedera:mainnet"];

async function resolveHashPackExplorerId(projectId: string): Promise<string | null> {
  if (HASHPACK_WALLET_ID) return HASHPACK_WALLET_ID;

  // Query Explorer API for HashPack's listing id (requires projectId)
  // Docs: https://docs.reown.com/cloud/explorer
  const url = new URL("https://explorer-api.walletconnect.com/v3/wallets");
  url.searchParams.set("projectId", projectId);
  url.searchParams.set("entries", "50");
  url.searchParams.set("page", "1");
  url.searchParams.set("search", "HashPack");

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    const json = await res.json();

    // Find the first wallet named 'HashPack'
    const hit = Array.isArray(json?.listings)
      ? json.listings.find((w: any) => (w?.name || "").toLowerCase() === "hashpack")
      : null;

    return hit?.id || null;
  } catch (error) {
    console.error("Failed to resolve HashPack explorer ID:", error);
    return null;
  }
}

export type WCSession = {
  client: Awaited<ReturnType<typeof SignClient.init>>;
  session: import("@walletconnect/types").SessionTypes.Struct;
};

export async function connectHashPack(opts?: {
  chains?: HederaChain[];
  themeMode?: "dark" | "light";
}): Promise<WCSession> {
  const chains = opts?.chains ?? DEFAULT_CHAINS;

  const client = await SignClient.init({ projectId: WC_PROJECT_ID });

  const hpId = await resolveHashPackExplorerId(WC_PROJECT_ID);
  console.log("HashPack Explorer ID:", hpId);

  const modal = new WalletConnectModal({
    projectId: WC_PROJECT_ID,
    themeMode: opts?.themeMode ?? "light",
    // Put HashPack first if we have its explorer id.
    explorerRecommendedWalletIds: hpId ? [hpId] : undefined,
  });

  const { uri, approval } = await client.connect({
    requiredNamespaces: {
      hedera: {
        methods: [...HEDERA_METHODS],
        chains,
        events: [], // Hedera doesn't require EVM-style events
      },
    },
  });

  if (uri) {
    await modal.openModal({ uri });
  }

  const session = await approval();
  modal.closeModal();

  // Soft detection: confirm the connected wallet is HashPack by metadata
  const isHashPack =
    (session.peer.metadata?.name || "").toLowerCase().includes("hashpack") ||
    (session.peer.metadata?.url || "").toLowerCase().includes("hashpack");

  console.log("Connected wallet:", session.peer.metadata?.name, "Is HashPack:", isHashPack);

  if (!isHashPack && hpId) {
    // If you strictly require HashPack, you could disconnect here.
    // For general multi-wallet, keep the session.
    console.warn("Connected wallet is not HashPack, but proceeding with connection");
  }

  return { client, session };
}

export async function signMessage(params: {
  client: WCSession["client"];
  session: WCSession["session"];
  signerAccountId: string; // e.g. "hedera:mainnet:0.0.1234"
  message: string;         // plain string; wallet will encode per spec
}): Promise<string> {
  const { client, session, signerAccountId, message } = params;

  const signature = await client.request<string>({
    topic: session.topic,
    chainId: session.namespaces.hedera.accounts[0].split(":").slice(0, 2).join(":"), // "hedera:mainnet"
    request: {
      method: "hedera_signMessage",
      params: { signerAccountId, message },
    },
  });

  return signature;
}

export async function disconnect(params: { client: WCSession["client"]; session: WCSession["session"] }) {
  const { client, session } = params;
  await client.disconnect({
    topic: session.topic,
    reason: { code: 6000, message: "User disconnected" },
  });
}

// Helper function to extract account ID from session
export function getHederaAccountId(session: WCSession["session"]): string | null {
  const accounts = session.namespaces.hedera?.accounts;
  return accounts && accounts.length > 0 ? accounts[0] : null;
}

// Helper function to check if connected wallet is HashPack
export function isHashPackWallet(session: WCSession["session"]): boolean {
  const metadata = session.peer.metadata;
  return (
    (metadata?.name || "").toLowerCase().includes("hashpack") ||
    (metadata?.url || "").toLowerCase().includes("hashpack")
  );
}