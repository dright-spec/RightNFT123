import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { purchaseService } from "@/lib/purchase-service";
import { useWalletUser } from "@/hooks/use-wallet-user";
import { formatCurrency } from "@/lib/utils";
import { 
  ShoppingCart, 
  Wallet, 
  CheckCircle, 
  ExternalLink, 
  AlertTriangle, 
  DollarSign,
  Shield,
  Zap,
  Star,
  TrendingUp,
  Award,
  Clock
} from "lucide-react";
import type { RightWithCreator } from "@shared/schema";

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  right: RightWithCreator;
  onPurchaseComplete: () => void;
}

interface PurchaseStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'current' | 'completed' | 'error';
}

export function PurchaseModal({ isOpen, onClose, right, onPurchaseComplete }: PurchaseModalProps) {
  const { toast } = useToast();
  const { 
    isConnected, 
    walletAddress, 
    connectWallet 
  } = useWalletUser();

  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [breakdown, setBreakdown] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState<string>('0');
  const [transactionHash, setTransactionHash] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [hasSufficientFunds, setHasSufficientFunds] = useState(false);

  const steps: PurchaseStep[] = [
    {
      id: 'connect',
      title: 'Connect Wallet',
      description: 'Connect your wallet to proceed with purchase',
      status: isConnected ? 'completed' : 'current'
    },
    {
      id: 'review',
      title: 'Review Purchase',
      description: 'Review price breakdown and confirm details',
      status: 'pending'
    },
    {
      id: 'confirm',
      title: 'Confirm Transaction',
      description: 'Sign the transaction in your wallet',
      status: 'pending'
    },
    {
      id: 'complete',
      title: 'Purchase Complete',
      description: 'Ownership transferred successfully',
      status: 'pending'
    }
  ];

  // Update step statuses based on current progress
  const updatedSteps = steps.map((step, index) => {
    if (index < currentStep) return { ...step, status: 'completed' as const };
    if (index === currentStep) return { ...step, status: 'current' as const };
    return { ...step, status: 'pending' as const };
  });

  // Initialize purchase data when modal opens
  useEffect(() => {
    if (isOpen && right) {
      fetchPurchaseBreakdown();
      if (isConnected) {
        setCurrentStep(1);
        checkWalletBalance();
      }
    }
  }, [isOpen, right, isConnected]);

  const fetchPurchaseBreakdown = async () => {
    try {
      const response = await fetch(`/api/purchase/breakdown/${right.id}`);
      if (response.ok) {
        const data = await response.json();
        setBreakdown(data);
      }
    } catch (error) {
      console.error('Failed to fetch purchase breakdown:', error);
    }
  };

  const checkWalletBalance = async () => {
    try {
      if (isConnected && walletAddress) {
        await purchaseService.initializeWallet('metamask');
        const { balance } = await purchaseService.getWalletBalance();
        setWalletBalance(balance);
        
        if (breakdown) {
          const sufficient = await purchaseService.validateSufficientFunds(right.price || '0');
          setHasSufficientFunds(sufficient);
        }
      }
    } catch (error) {
      console.error('Failed to check wallet balance:', error);
    }
  };

  const handleConnectWallet = async () => {
    try {
      setIsProcessing(true);
      const success = await connectWallet();
      if (success) {
        setCurrentStep(1);
        await checkWalletBalance();
      }
    } catch (error) {
      setError('Failed to connect wallet');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurchaseConfirm = async () => {
    if (!isConnected || !walletAddress || !right.ownerAddress) {
      setError('Wallet not connected or invalid right data');
      return;
    }

    try {
      setIsProcessing(true);
      setCurrentStep(2);
      setError('');

      // Execute the purchase transaction
      const result = await purchaseService.executePurchase(
        right.id,
        right.price || '0',
        right.ownerAddress,
        right.currency || 'ETH'
      );

      if (result.success && result.transactionHash) {
        setTransactionHash(result.transactionHash);
        setCurrentStep(3);
        
        // Show success message
        toast({
          title: "Purchase Successful!",
          description: "You now own this right. Transaction confirmed on blockchain.",
        });

        // Call completion callback
        onPurchaseComplete();
        
        // Auto-close modal after showing success
        setTimeout(() => {
          onClose();
        }, 3000);
        
      } else {
        setError(result.error || 'Purchase failed');
        setCurrentStep(1);
      }
    } catch (error: any) {
      setError(error.message || 'Purchase failed');
      setCurrentStep(1);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(0);
    setError('');
    setTransactionHash('');
    setIsProcessing(false);
    onClose();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Connect Wallet
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Wallet className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Connect Your Wallet</h3>
              <p className="text-muted-foreground">
                Connect your Ethereum wallet to purchase this right securely
              </p>
            </div>
            
            <Button 
              onClick={handleConnectWallet}
              disabled={isProcessing}
              className="w-full"
              size="lg"
            >
              {isProcessing ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          </div>
        );

      case 1: // Review Purchase
        return (
          <div className="space-y-6">
            <div className="text-center">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h3 className="text-xl font-semibold mb-2">Review Your Purchase</h3>
              <p className="text-muted-foreground">
                Double-check the details before confirming
              </p>
            </div>

            {/* Right Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{right.title}</CardTitle>
                <CardDescription>by {right.creator?.username}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary">{right.type}</Badge>
                  {right.paysDividends && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Pays Dividends
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {right.description}
                </p>
              </CardContent>
            </Card>

            {/* Price Breakdown */}
            {breakdown && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Price Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Item Price</span>
                    <span className="font-semibold">{formatCurrency(breakdown.itemPrice)} ETH</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Platform Fee (2.5%)</span>
                    <span>{formatCurrency(breakdown.platformFee)} ETH</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Creator Royalty (5%)</span>
                    <span>{formatCurrency(breakdown.royaltyFee)} ETH</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Gas Fee (estimated)</span>
                    <span>{formatCurrency(breakdown.gasFee)} ETH</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(breakdown.totalAmount)} ETH</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Wallet Balance */}
            <Card className={`border-2 ${hasSufficientFunds ? 'border-green-200 bg-green-50/50' : 'border-red-200 bg-red-50/50'}`}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    <span>Wallet Balance</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(parseFloat(walletBalance))} ETH</span>
                </div>
                
                {!hasSufficientFunds && (
                  <Alert className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Insufficient balance. You need {breakdown && formatCurrency(breakdown.totalAmount - parseFloat(walletBalance))} ETH more.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Benefits Reminder with Enhanced Value Proposition */}
            <Card className="bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 border-amber-200 shadow-lg">
              <CardContent className="pt-6">
                <h4 className="font-bold mb-4 flex items-center gap-2 text-lg">
                  <Star className="w-6 h-6 text-amber-500" />
                  🎉 Instant Value Unlock
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Blockchain Ownership</p>
                        <p className="text-xs text-muted-foreground">Immutable proof of ownership</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium">{right.paysDividends ? '💰 Passive Income' : '🎯 Complete Control'}</p>
                        <p className="text-xs text-muted-foreground">
                          {right.paysDividends ? 'Automatic dividend payments' : 'Full ownership transfer'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium">🚀 Instant Liquidity</p>
                        <p className="text-xs text-muted-foreground">Trade immediately on marketplace</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium">⚖️ Legal Protection</p>
                        <p className="text-xs text-muted-foreground">Full legal documentation included</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Urgency Element */}
                <div className="mt-4 p-3 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-red-500" />
                    <span className="font-medium text-red-700">
                      Limited Opportunity - This right is unique and cannot be recreated
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={handlePurchaseConfirm}
              disabled={isProcessing || !hasSufficientFunds}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold text-lg py-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              size="lg"
            >
              {isProcessing ? (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing Purchase...
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5" />
                  🚀 Complete Purchase for {breakdown && formatCurrency(breakdown.totalAmount)} ETH
                  <TrendingUp className="w-5 h-5" />
                </div>
              )}
            </Button>
            
            {hasSufficientFunds && (
              <div className="text-center space-y-2">
                <p className="text-sm text-green-600 font-medium">✅ Wallet balance sufficient</p>
                <p className="text-xs text-muted-foreground">
                  🔒 Secure blockchain transaction • ⚡ Instant ownership transfer
                </p>
              </div>
            )}
          </div>
        );

      case 2: // Confirm Transaction
        return (
          <div className="space-y-6 text-center">
            <div className="space-y-4">
              <Zap className="w-16 h-16 mx-auto text-yellow-500 animate-pulse" />
              <h3 className="text-xl font-semibold">Confirm in Your Wallet</h3>
              <p className="text-muted-foreground">
                Please confirm the transaction in your wallet to complete the purchase
              </p>
            </div>
            
            <Progress value={66} className="w-full" />
            
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Your transaction is being processed securely on the Ethereum blockchain
              </AlertDescription>
            </Alert>
          </div>
        );

      case 3: // Complete
        return (
          <div className="space-y-6 text-center">
            <div className="space-y-4 animate-pulse">
              <div className="relative">
                <CheckCircle className="w-20 h-20 mx-auto text-green-500 animate-bounce" />
                <div className="absolute inset-0 w-20 h-20 mx-auto rounded-full bg-green-500/20 animate-ping"></div>
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-green-700">🎉 Congratulations!</h3>
                <div className="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-lg p-4">
                  <p className="text-lg font-semibold text-green-800">You are now the owner of this right!</p>
                  <p className="text-sm text-green-600 mt-1">
                    🔒 Secured on Ethereum blockchain • ⚡ Ownership transferred instantly
                  </p>
                </div>
              </div>
            </div>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Transaction Hash</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono">{transactionHash.slice(0, 10)}...{transactionHash.slice(-8)}</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => window.open(`https://etherscan.io/tx/${transactionHash}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <Badge className="bg-green-100 text-green-800">
                      Confirmed
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  What's Next?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 mt-1 text-blue-500" />
                    <div>
                      <p className="font-medium">View in Dashboard</p>
                      <p className="text-muted-foreground">Check your purchased rights in your dashboard</p>
                    </div>
                  </div>
                  {right.paysDividends && (
                    <div className="flex items-start gap-3">
                      <TrendingUp className="w-4 h-4 mt-1 text-green-500" />
                      <div>
                        <p className="font-medium">Receive Dividends</p>
                        <p className="text-muted-foreground">Automatic payments will be sent to your wallet</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <ShoppingCart className="w-4 h-4 mt-1 text-purple-500" />
                    <div>
                      <p className="font-medium">Trade on Marketplace</p>
                      <p className="text-muted-foreground">List your right for sale whenever you want</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <Button 
                onClick={handleClose} 
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold py-4 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <Award className="w-5 h-5 mr-2" />
                🎯 View Your New Asset in Dashboard
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => window.open('/marketplace', '_blank')}
                  className="font-medium border-2 hover:bg-primary/5"
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Browse More
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(`I just purchased "${right.title}" on Dright! 🚀 Check out this amazing rights marketplace.`);
                    toast({ title: "Copied to clipboard!", description: "Share your success with friends" });
                  }}
                  className="font-medium border-2 hover:bg-green/5"
                >
                  📢 Share Success
                </Button>
              </div>
              
              <div className="text-center p-3 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg">
                <p className="text-sm font-medium text-amber-800">
                  🏆 Achievement Unlocked: Rights Owner!
                </p>
                <p className="text-xs text-amber-600 mt-1">
                  You're now part of the new creator economy
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Purchase Right
          </DialogTitle>
          <DialogDescription>
            Secure blockchain-based ownership transfer
          </DialogDescription>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            {updatedSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  step.status === 'completed' ? 'bg-green-500 border-green-500 text-white' :
                  step.status === 'current' ? 'bg-primary border-primary text-white' :
                  'bg-muted border-muted-foreground/30 text-muted-foreground'
                }`}>
                  {step.status === 'completed' ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                {index < updatedSteps.length - 1 && (
                  <div className={`w-12 h-px ml-2 ${
                    step.status === 'completed' ? 'bg-green-500' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <h4 className="font-semibold">{updatedSteps[currentStep]?.title}</h4>
            <p className="text-sm text-muted-foreground">{updatedSteps[currentStep]?.description}</p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
}