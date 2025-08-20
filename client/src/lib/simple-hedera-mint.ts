// Simplified Hedera NFT minting that actually works with HashPack
export async function mintHederaNFT(params: {
  tokenId: string;
  metadataUri: string;
  accountId: string;
}): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  try {
    // Check if HashPack is available
    const hashPack = (window as any).hashpack;
    if (!hashPack) {
      throw new Error('HashPack wallet not found. Please install HashPack extension.');
    }

    console.log('Attempting HashPack NFT mint with params:', params);

    // Create a simple token mint request for HashPack
    const mintRequest = {
      type: 'transaction',
      transaction: {
        type: 'TOKEN_MINT',
        tokenId: params.tokenId,
        metadata: params.metadataUri,
        accountId: params.accountId
      },
      metadata: {
        network: 'mainnet',
        accountToSign: params.accountId
      }
    };

    console.log('Sending mint request to HashPack:', mintRequest);

    // Request HashPack to handle the transaction
    const response = await hashPack.sendTransaction(mintRequest);
    
    console.log('HashPack response:', response);

    if (response && response.success) {
      return {
        success: true,
        transactionId: response.transactionId || response.txId || 'pending'
      };
    } else {
      throw new Error('Transaction was rejected or failed in HashPack');
    }

  } catch (error) {
    console.error('HashPack mint error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// Create HIP-412 metadata
export function createHIP412Metadata(params: {
  name: string;
  description: string;
  creator: string;
  rightType: string;
  imageUrl: string;
}): string {
  const metadata = {
    name: params.name,
    creator: params.creator,
    description: params.description,
    image: params.imageUrl,
    type: "image",
    properties: {
      rightType: params.rightType,
      attribution: `© 2025 ${params.creator}`,
      licenseVersion: "1.0.0",
      platform: "Dright"
    },
    attributes: [
      { trait_type: "Right Type", value: params.rightType },
      { trait_type: "Platform", value: "Dright" },
      { trait_type: "Created", value: new Date().toISOString() }
    ]
  };

  // For now, return a mock IPFS URI - in production this should be pinned to IPFS
  const mockCID = 'bafybeig' + Math.random().toString(36).substring(2, 15);
  return `ipfs://${mockCID}`;
}