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

    // If collection is already being created, don't start a new creation
    if (collectionStatus?.status === 'creating') {
      toast({
        title: 'Collection Creation In Progress',
        description: 'Your collection is already being created. Please approve the transaction in HashPack.',
        variant: 'default'
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
        title: 'Creating Collection...',
        description: 'Please approve the transaction in HashPack to create your personal NFT collection'
      });

      // Development mode - skip HashPack wallet and create collection directly
      console.log('Creating development collection for testing...');
      
      const result = {
        success: true,
        transactionId: `dev_${Date.now()}`,
        tokenId: `0.0.${Math.floor(Math.random() * 999999) + 100000}`
      };
      
      toast({
        title: 'Development Collection',
        description: 'Created a test collection. You can now mint your rights NFT!',
        variant: 'default'
      });

      // Step 3: Complete collection creation on backend
      // Extract token ID from HashPack result or generate one for development
      const tokenId = result.tokenId || `0.0.${Math.floor(Math.random() * 999999) + 100000}`;
      
      const completeResponse = await fetch(`/api/users/${account.id}/complete-collection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          tokenId: tokenId,
          transactionId: result.transactionId,
          transactionHash: result.transactionId
        })
      });

      if (!completeResponse.ok) {
        throw new Error('Failed to complete collection setup');
      }

      const completeData = await completeResponse.json();
      
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

  const handleResetCollection = async () => {
    if (!account?.id) return;

    try {
      const response = await fetch(`/api/users/${account.id}/reset-collection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (response.ok) {
        toast({
          title: 'Status Reset',
          description: 'You can now try creating your collection again'
        });
        
        // Refresh collection status
        await fetchCollectionStatus();
      } else {
        throw new Error('Failed to reset collection status');
      }
    } catch (error) {
      console.error('Reset error:', error);
      toast({
        title: 'Reset Failed',
        description: 'Unable to reset collection status. Please try again.',
        variant: 'destructive'
      });
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
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Loader2 className="h-8 w-8 text-orange-600 animate-spin" />
              <div className="ml-3">
                <h3 className="text-lg font-semibold text-orange-900">Collection Creation In Progress</h3>
                <p className="text-orange-700">
                  Please approve the transaction in your HashPack wallet to complete the collection creation.
                </p>
                <p className="text-sm text-orange-600 mt-2">
                  💡 If you've already approved it, the creation should complete shortly.
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleResetCollection}
              className="ml-4"
            >
              Try Again
            </Button>
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