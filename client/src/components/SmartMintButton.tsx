import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Wallet, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/contexts/WalletContext';
import { CollectionSetup } from './CollectionSetup';
import { connectAndMintNFT } from '@/lib/bulletproof-hedera-minting';

interface SmartMintButtonProps {
  rightId: number;
  disabled?: boolean;
  className?: string;
}

interface MintResponse {
  success: boolean;
  message?: string;
  needsCollection?: boolean;
  userAccountId?: string;
  userName?: string;
  displayName?: string;
  data?: {
    transactionParams?: {
      collectionTokenId: string;
      userAccountId: string;
      metadataPointer: string;
    };
  };
  error?: string;
}

export function SmartMintButton({ rightId, disabled = false, className = "" }: SmartMintButtonProps) {
  const [isMinting, setIsMinting] = useState(false);
  const [showCollectionDialog, setShowCollectionDialog] = useState(false);
  const [mintParams, setMintParams] = useState<MintResponse | null>(null);
  const { account } = useWallet();
  const { toast } = useToast();

  const handleMintClick = async () => {
    if (!account?.id) {
      toast({
        title: 'Authentication Required',
        description: 'Please connect your wallet first',
        variant: 'destructive'
      });
      return;
    }

    setIsMinting(true);

    try {
      // Step 1: Check if user can mint (has collection, etc.)
      const response = await fetch(`/api/rights/${rightId}/mint`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      const result: MintResponse = await response.json();

      if (!response.ok) {
        if (result.needsCollection) {
          // User needs to create a collection first
          setMintParams(result);
          setShowCollectionDialog(true);
          setIsMinting(false);
          return;
        }
        
        throw new Error(result.error || 'Failed to prepare minting');
      }

      // Step 2: User has collection, proceed with minting
      if (result.success && result.data?.transactionParams) {
        const params = result.data.transactionParams;
        
        toast({
          title: '🚀 Opening HashPack Wallet',
          description: 'Please approve the NFT minting transaction. Estimated fee: ~0.01 HBAR',
          className: 'bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200'
        });

        // Step 3: Execute minting (simulated in development)
        const mintResult = await connectAndMintNFT({
          metadataPointer: params.metadataPointer,
          collectionTokenId: params.collectionTokenId,
          userAccountId: params.userAccountId
        });

        if (!mintResult.success) {
          throw new Error(mintResult.error || 'Minting failed');
        }

        // Step 4: Complete the minting on backend
        // Extract serial number from mint result (defaults to 1 for first NFT in collection)
        const serialNumber = (mintResult as any).serialNumber || "1";
        
        // Send collection ID and serial number separately
        // Backend will create the full NFT identifier as collectionId#serialNumber
        const completeResponse = await fetch(`/api/rights/${rightId}/mint-complete`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tokenId: params.collectionTokenId, // Collection ID (e.g., 0.0.9268164)
            transactionId: mintResult.transactionId,
            transactionHash: mintResult.transactionId,
            serialNumber: serialNumber // NFT serial number (e.g., 1, 2, 3...)
          })
        });

        if (!completeResponse.ok) {
          throw new Error('Failed to complete minting process');
        }

        toast({
          title: '✨ NFT Minted Successfully!',
          description: `Your rights NFT is now in your HashPack wallet! Collection: ${params.collectionTokenId} | Serial #${serialNumber}`,
          className: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
        });

        // Refresh the page to show updated status
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }

    } catch (error) {
      console.error('Minting error:', error);
      toast({
        title: '⚠️ Minting Issue',
        description: error instanceof Error ? error.message : 'Unable to complete minting. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsMinting(false);
    }
  };

  const handleCollectionCreated = () => {
    setShowCollectionDialog(false);
    setMintParams(null);
    
    toast({
      title: 'Collection Ready!',
      description: 'You can now mint your NFT'
    });

    // Auto-trigger minting after collection is created
    setTimeout(() => {
      handleMintClick();
    }, 1000);
  };

  return (
    <>
      <Button
        onClick={handleMintClick}
        disabled={disabled || isMinting || !account?.hederaAccountId}
        className={className}
        size="lg"
      >
        {isMinting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Minting to Hedera...
          </>
        ) : (
          <>
            <Wallet className="h-4 w-4 mr-2" />
            Mint on Hedera
          </>
        )}
      </Button>

      <Dialog open={showCollectionDialog} onOpenChange={setShowCollectionDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Wallet className="h-6 w-6 mr-2" />
              Collection Setup Required
            </DialogTitle>
            <DialogDescription>
              Before you can mint rights as NFTs, you need to create your personal collection on Hedera.
              This is a one-time setup that gives you a dedicated space for all your rights.
            </DialogDescription>
          </DialogHeader>

          {mintParams?.needsCollection && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Why do I need this?</strong> Each user gets their own NFT collection to keep their rights 
                properly isolated and organized. This ensures full ownership and control over your digital assets.
              </AlertDescription>
            </Alert>
          )}

          <CollectionSetup
            onCollectionCreated={handleCollectionCreated}
            showTitle={false}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}