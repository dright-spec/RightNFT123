import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Loader2, CreditCard, Shield, Wallet, ExternalLink } from 'lucide-react'
import { useWallet } from '@/contexts/WalletContext'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { apiRequest } from '@/lib/queryClient'

interface WalletPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  right: any // Replace with proper type
}

export function WalletPaymentModal({ isOpen, onClose, right }: WalletPaymentModalProps) {
  const { isConnected, address, balance, isHedera, networkName } = useWallet()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [transactionHash, setTransactionHash] = useState<string | null>(null)

  // Calculate pricing (in HBAR or ETH based on network)
  const price = parseFloat(right?.price || "0")
  const platformFee = price * 0.025 // 2.5% platform fee
  const networkFee = isHedera ? 0.001 : 0.002 // Lower fees on Hedera
  const total = price + platformFee + networkFee

  const currency = isHedera ? 'HBAR' : 'ETH'
  const currencySymbol = isHedera ? 'ℏ' : 'Ξ'

  const purchaseMutation = useMutation({
    mutationFn: async () => {
      if (!isConnected || !address) {
        throw new Error('Wallet not connected')
      }

      // Mock transaction for development
      const mockTxHash = `0x${Date.now().toString(16)}${Math.random().toString(16).slice(2, 10)}`
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setTransactionHash(mockTxHash)
      
      // Call backend API to record purchase
      const purchaseResult = await apiRequest('POST', `/api/rights/${right.id}/purchase`, {
        transactionHash: mockTxHash,
        amount: total.toString(),
        currency,
        buyerAddress: address,
        network: isHedera ? 'hedera' : 'ethereum'
      })

      return purchaseResult
    },
    onSuccess: () => {
      toast({
        title: 'Purchase Successful!',
        description: `You now own "${right.title}". The NFT has been transferred to your wallet.`,
      })
      queryClient.invalidateQueries({ queryKey: ['/api/rights'] })
      onClose()
    },
    onError: (error: any) => {
      toast({
        title: 'Purchase Failed',
        description: error.message || 'Transaction failed. Please try again.',
        variant: 'destructive',
      })
    }
  })

  const handlePurchase = async () => {
    if (!isConnected) {
      toast({
        title: 'Wallet Not Connected',
        description: 'Please connect your wallet to make a purchase.',
        variant: 'destructive',
      })
      return
    }

    purchaseMutation.mutate()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Purchase Digital Right</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Right Details */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">{right?.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      by {right?.creator?.username || "Anonymous"}
                    </p>
                  </div>
                  <Badge variant="secondary">{right?.type}</Badge>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {right?.description?.slice(0, 100)}
                  {(right?.description?.length || 0) > 100 && "..."}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Breakdown */}
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Payment Breakdown
            </h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Right Price</span>
                <span>{price.toFixed(4)} {currencySymbol}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Platform Fee (2.5%)</span>
                <span>{platformFee.toFixed(4)} {currencySymbol}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Network Fee</span>
                <span>{networkFee.toFixed(6)} {currencySymbol}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{total.toFixed(4)} {currencySymbol}</span>
              </div>
            </div>
          </div>

          {/* Network Info */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Network</p>
                <p className="text-xs text-muted-foreground">{networkName}</p>
              </div>
              <Badge variant={isHedera ? "default" : "secondary"}>
                {currencySymbol}
              </Badge>
            </div>
            {balance && (
              <p className="text-xs text-muted-foreground mt-1">
                Balance: {balance}
              </p>
            )}
          </div>

          {/* Transaction Hash */}
          {transactionHash && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Transaction:</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    const explorerUrl = isHedera 
                      ? `https://hashscan.io/${networkName.includes('Testnet') ? 'testnet' : 'mainnet'}/transaction/${transactionHash}`
                      : `https://etherscan.io/tx/${transactionHash}`
                    window.open(explorerUrl, '_blank')
                  }}
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  View
                </Button>
              </div>
              <code className="text-xs text-muted-foreground block mt-1">
                {transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}
              </code>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              disabled={purchaseMutation.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={handlePurchase}
              disabled={purchaseMutation.isPending || !isConnected}
              className="flex-1"
            >
              {purchaseMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Buy for {total.toFixed(4)} {currencySymbol}
                </>
              )}
            </Button>
          </div>

          {/* Security Notice */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-3 h-3" />
              <span>
                Secure payment powered by {isHedera ? 'Hedera Hashgraph' : 'Ethereum blockchain'}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}