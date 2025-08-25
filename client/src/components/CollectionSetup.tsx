import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2, Wallet } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useWallet } from '@/contexts/WalletContext';
import { userCollectionManager } from '@/lib/user-collection-manager';

interface CollectionSetupProps {
  onCollectionCreated?: (tokenId: string) => void;
  showTitle?: boolean;
}

interface CollectionStatus {
  hasCollection: boolean;
  collectionTokenId?: string;
  status: 'not_created' | 'creating' | 'created' | 'failed';
  createdAt?: string;
}

export function CollectionSetup({ onCollectionCreated, showTitle = true }: CollectionSetupProps) {
  const [collectionStatus, setCollectionStatus] = useState<CollectionStatus | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { account } = useWallet();
  const { toast } = useToast();

  // Fetch user's collection status
  const fetchCollectionStatus = async () => {
    if (!account?.id) return;

    try {
      const response = await fetch(`/api/users/${account.id}/collection-status`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setCollectionStatus(data.data);
      } else {
        console.error('Failed to fetch collection status');
      }
    } catch (error) {
      console.error('Error fetching collection status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset invalid collection
  const handleResetCollection = async () => {
    if (!account?.id) return;
    
    setIsCreating(true);
    try {
      const response = await fetch(`/api/users/${account.id}/reset-collection`, {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        toast({
          title: 'Collection Reset',
          description: 'Invalid collection has been cleared. You can now create a new one.',
          variant: 'default'
        });
        
        // Refresh collection status
        await fetchCollectionStatus();
      } else {
        throw new Error('Failed to reset collection');
      }
    } catch (error) {
      console.error('Error resetting collection:', error);
      toast({
        title: 'Reset Failed',
        description: 'Could not reset the collection. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    fetchCollectionStatus();
  }, [account?.id]);

  const handleCreateCollection = async () => {
    if (!account?.id || !account.hederaAccountId) {
      toast({
        title: 'Wallet Required',
        description: 'Please connect your HashPack wallet first',
        variant: 'destructive'
      });
      return;
    }

    setIsCreating(true);

    try {
      // Step 1: Initiate collection creation on backend
      const initResponse = await fetch(`/api/users/${account.id}/create-collection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userName: account?.username || 'user',
          displayName: account?.username || 'User'
        })
      });

      if (!initResponse.ok) {
        throw new Error('Failed to initiate collection creation');
      }

      const initData = await initResponse.json();
      
      if (initData.data.status === 'created') {
        // Collection already exists
        setCollectionStatus({
          hasCollection: true,
          collectionTokenId: initData.data.collectionTokenId,
          status: 'created'
        });
        
        toast({
          title: 'Collection Ready!',
          description: 'Your personal NFT collection is already set up'
        });
        
        if (onCollectionCreated) {
          onCollectionCreated(initData.data.collectionTokenId);
        }
        return;
      }

      // Step 2: Create collection via HashPack
      const collectionParams = initData.data.collectionParams;
      
      toast({
        title: 'Opening HashPack...',
        description: 'Please approve the collection creation transaction in your HashPack wallet (costs ~$1 HBAR)'
      });

      // Create real collection via HashPack
      console.log('Creating real NFT collection on Hedera...');
      console.log('Account details:', {
        hederaAccountId: account.hederaAccountId,
        username: account.username,
        displayName: account.displayName
      });
      
      // Add a small delay to ensure UI updates
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use the userCollectionManager to create a real collection
      const result = await userCollectionManager.createUserCollection({
        userAccountId: account.hederaAccountId,
        userName: account.username || 'user',
        displayName: (account as any).displayName || account.username
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create collection');
      }
      
      toast({
        title: 'Collection Created on Hedera!',
        description: `Your NFT collection has been created. Transaction: ${result.transactionId}`,
        variant: 'default'
      });

      // Step 3: Complete collection creation on backend
      // If we don't have the token ID, pass the transaction ID for the backend to extract it
      const tokenId = result.tokenId;
      const transactionId = result.transactionId;
      
      if (!transactionId) {
        throw new Error('No transaction ID returned from collection creation');
      }
      
      // If we don't have the token ID from the response, we need to query for it
      // Pass the transaction ID to the backend which will retrieve the actual token ID
      
      const completeResponse = await fetch(`/api/users/${account.id}/complete-collection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tokenId: tokenId || null, // Only use real token ID if available
          transactionId: transactionId,
          transactionHash: transactionId,
          needsTokenIdRetrieval: !tokenId // Flag to indicate we need to fetch token ID from transaction
        })
      });

      if (!completeResponse.ok) {
        throw new Error('Failed to complete collection setup');
      }

      const completeData = await completeResponse.json();
      
      if (completeData.data.needsManualVerification) {
        // Collection is pending verification, need to check transaction on HashScan
        toast({
          title: 'Collection Transaction Submitted',
          description: 'Please wait while we verify your collection on the blockchain. This may take up to 30 seconds.',
          duration: 5000
        });
        
        // Poll for collection status
        let attempts = 0;
        const maxAttempts = 10;
        const pollInterval = setInterval(async () => {
          attempts++;
          
          try {
            const statusResponse = await fetch(`/api/users/${account.id}/collection-status`, {
              credentials: 'include'
            });
            
            if (statusResponse.ok) {
              const statusData = await statusResponse.json();
              
              if (statusData.data.hasCollection && statusData.data.status === 'created') {
                clearInterval(pollInterval);
                setCollectionStatus({
                  hasCollection: true,
                  collectionTokenId: statusData.data.collectionTokenId,
                  status: 'created',
                  createdAt: new Date().toISOString()
                });
                
                toast({
                  title: 'Collection Created!',
                  description: `Your NFT collection is ready: ${statusData.data.collectionTokenId}`
                });
                
                if (onCollectionCreated) {
                  onCollectionCreated(statusData.data.collectionTokenId);
                }
              }
            }
          } catch (error) {
            console.error('Error polling collection status:', error);
          }
          
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            // Try to get token ID from HashScan manually
            window.open(`https://hashscan.io/mainnet/transaction/${transactionId}`, '_blank');
            toast({
              title: 'Manual Verification Required',
              description: 'Please check HashScan for your collection token ID and contact support.',
              variant: 'destructive'
            });
          }
        }, 3000);
        
      } else if (completeData.data.collectionTokenId) {
        // Collection created successfully with token ID
        setCollectionStatus({
          hasCollection: true,
          collectionTokenId: completeData.data.collectionTokenId,
          status: 'created',
          createdAt: new Date().toISOString()
        });

        toast({
          title: 'Collection Created!',
          description: `Your personal NFT collection is now ready for minting rights`
        });

        if (onCollectionCreated) {
          onCollectionCreated(completeData.data.collectionTokenId);
        }
      }

    } catch (error) {
      console.error('Collection creation error:', error);
      toast({
        title: 'Collection Creation Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Checking collection status...</span>
        </CardContent>
      </Card>
    );
  }

  if (collectionStatus?.hasCollection && collectionStatus.status === 'created') {
    // Check if this is an invalid token ID
    // We should verify the token exists on the blockchain
    const tokenId = collectionStatus.collectionTokenId;
    const isInvalidToken = false; // Remove this check as it's not reliable
    
    if (isInvalidToken) {
      return (
        <Card className="w-full max-w-2xl mx-auto border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6 space-y-4">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-yellow-900">Invalid Collection Detected</h3>
                <p className="text-yellow-700">
                  Your collection token ID doesn't exist on Hedera mainnet.
                </p>
                <p className="text-sm text-yellow-600 mt-1">
                  Token ID: {collectionStatus.collectionTokenId} (Invalid)
                </p>
              </div>
            </div>
            <Alert className="border-yellow-300 bg-yellow-100">
              <AlertCircle className="h-4 w-4 text-yellow-700" />
              <AlertDescription className="text-yellow-800">
                This is a test token ID that was created for development. To mint real NFTs on Hedera, 
                you need to reset this and create a real collection through HashPack.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={handleResetCollection}
              disabled={isCreating}
              className="w-full"
              variant="outline"
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Resetting...
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Reset Invalid Collection
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card className="w-full max-w-2xl mx-auto border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-green-900">Collection Ready!</h3>
              <p className="text-green-700">
                Your personal NFT collection is set up and ready for minting rights.
              </p>
              {collectionStatus.collectionTokenId && (
                <p className="text-sm text-green-600 mt-1">
                  Token ID: {collectionStatus.collectionTokenId}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (collectionStatus?.status === 'creating') {
    return (
      <Card className="w-full max-w-2xl mx-auto border-orange-200 bg-orange-50">
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center">
              <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-orange-900">Collection Creation In Progress</h3>
                <p className="text-orange-700">
                  Please approve the transaction in your HashPack wallet to complete the collection creation.
                </p>
                <p className="text-sm text-orange-600 mt-2">
                  💡 If HashPack didn't open, click "Trigger HashPack" below.
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="default"
                onClick={async () => {
                  // Retry collection creation - trigger HashPack again
                  await handleResetCollection();
                  await handleCreateCollection();
                }}
                disabled={isCreating}
                className="flex-1"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Wallet className="h-4 w-4 mr-2" />
                    Trigger HashPack
                  </>
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={handleResetCollection}
                disabled={isCreating}
              >
                Cancel & Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center">
            <Wallet className="h-6 w-6 mr-2" />
            Create Your NFT Collection
          </CardTitle>
          <CardDescription>
            Before minting rights as NFTs, you need to create your personal collection on Hedera.
            This ensures your rights are isolated and properly organized under your ownership.
          </CardDescription>
        </CardHeader>
      )}
      
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>One-time setup:</strong> Creating a collection costs approximately $1 in HBAR and gives you a dedicated space for all your rights NFTs.
            Once created, you can mint unlimited rights to this collection.
          </AlertDescription>
        </Alert>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Your Collection Details:</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>Name:</strong> {account?.username} Rights Collection</li>
            <li>• <strong>Owner:</strong> {account?.hederaAccountId}</li>
            <li>• <strong>Type:</strong> Non-Fungible Unique (NFT)</li>
            <li>• <strong>Supply:</strong> Unlimited (you can mint as many rights as needed)</li>
          </ul>
        </div>

        <Button 
          onClick={handleCreateCollection}
          disabled={isCreating || !account?.hederaAccountId}
          className="w-full"
          size="lg"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Creating Collection...
            </>
          ) : (
            <>
              <Wallet className="h-4 w-4 mr-2" />
              Create My NFT Collection
            </>
          )}
        </Button>

        {!account?.hederaAccountId && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please connect your HashPack wallet with a valid Hedera account to create a collection.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}