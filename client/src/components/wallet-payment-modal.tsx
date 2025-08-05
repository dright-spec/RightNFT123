import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { hederaPaymentService } from "@/lib/hedera-payment-service";
import { useMultiWallet } from "@/contexts/MultiWalletContext";
import { 
  Wallet, 
  CreditCard, 
  Shield, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Loader2
} from "lucide-react";
import type { RightWithCreator } from "@shared/schema";

interface WalletPaymentModalProps {
  right: RightWithCreator;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PaymentStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "active" | "completed" | "error";
}

export function WalletPaymentModal({ right, isOpen, onClose, onSuccess }: WalletPaymentModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [transactionHash, setTransactionHash] = useState<string>("");
  const [paymentSteps, setPaymentSteps] = useState<PaymentStep[]>([
    {
      id: "hashpack-connect",
      title: "HashPack Connection",
      description: "Connecting to your HashPack wallet",
      status: "active"
    },
    {
      id: "payment-approval",
      title: "HBAR Payment Approval", 
      description: "Approve the HBAR transaction in HashPack",
      status: "pending"
    },
    {
      id: "hedera-confirmation",
      title: "Hedera Network Confirmation",
      description: "Waiting for Hedera consensus confirmation",
      status: "pending"
    },
    {
      id: "nft-transfer",
      title: "HTS NFT Transfer",
      description: "Transferring Hedera Token Service NFT to you",
      status: "pending"
    }
  ]);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hederaAccountId, walletType } = useMultiWallet();

  // Calculate fees and totals (in HBAR)
  const price = parseFloat(right.price || "0");
  const platformFee = price * 0.025; // 2.5% platform fee
  const hederaNetworkFee = 0.001; // ~0.001 HBAR for standard transactions
  const total = price + platformFee + hederaNetworkFee;

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async () => {
      // Check Hedera wallet connection
      if (!hederaAccountId || walletType !== 'hashpack') {
        throw new Error("HashPack wallet not connected");
      }

      // Step 1: HashPack connection (already done)
      updateStepStatus(0, "completed");
      setCurrentStep(1);
      updateStepStatus(1, "active");

      // Step 2: Process HBAR payment through Hedera network
      const paymentResult = await hederaPaymentService.processPayment({
        to: right.creatorWallet || right.creatorHederaAccount || '', 
        amount: price.toString(),
        currency: 'HBAR',
        rightId: right.id
      });

      setTransactionHash(paymentResult.transactionHash);

      updateStepStatus(1, "completed");
      setCurrentStep(2);
      updateStepStatus(2, "active");

      // Step 3: Wait for Hedera consensus confirmation
      await new Promise(resolve => setTimeout(resolve, 3000)); // Hedera consensus is ~3 seconds
      updateStepStatus(2, "completed");
      setCurrentStep(3);
      updateStepStatus(3, "active");

      // Step 4: Process HTS NFT transfer on backend
      const purchaseResult = await apiRequest("POST", `/api/rights/${right.id}/purchase`, {
        transactionHash: paymentResult.transactionHash,
        amount: total.toString(),
        currency: "HBAR",
        buyerHederaAccount: hederaAccountId
      });

      updateStepStatus(3, "completed");
      return purchaseResult;
    },
    onSuccess: () => {
      toast({
        title: "Purchase Successful!",
        description: `You now own "${right.title}". The right has been transferred to your wallet.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rights"] });
      queryClient.invalidateQueries({ queryKey: [`/api/rights/${right.id}`] });
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      const errorStep = Math.max(0, currentStep);
      updateStepStatus(errorStep, "error");
      toast({
        title: "Purchase Failed",
        description: error.message || "Transaction failed. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateStepStatus = (stepIndex: number, status: PaymentStep["status"]) => {
    setPaymentSteps(prev => prev.map((step, index) => 
      index === stepIndex ? { ...step, status } : step
    ));
  };

  const handlePurchase = async () => {
    try {
      // Check Hedera wallet connection
      if (!hederaAccountId || walletType !== 'hashpack') {
        toast({
          title: "HashPack Not Connected",
          description: "Please connect your HashPack wallet first to make a purchase.",
          variant: "destructive",
        });
        return;
      }

      purchaseMutation.mutate();
    } catch (error) {
      console.error("Purchase error:", error);
      toast({
        title: "Purchase Error",
        description: "Failed to initiate purchase. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStepIcon = (step: PaymentStep) => {
    switch (step.status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "active":
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case "error":
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Purchase with Wallet
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Right Details */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">{right.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      by {right.creator?.username || "Anonymous"}
                    </p>
                  </div>
                  <Badge variant="secondary">{right.type}</Badge>
                </div>
                
                <div className="text-xs text-muted-foreground">
                  {right.description?.slice(0, 100)}
                  {(right.description?.length || 0) > 100 && "..."}
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
                <span>{price.toFixed(4)} ℏ</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Platform Fee (2.5%)</span>
                <span>{platformFee.toFixed(4)} ℏ</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Network Fee</span>
                <span>{hederaNetworkFee.toFixed(6)} ℏ</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{total.toFixed(4)} ℏ</span>
              </div>
            </div>
          </div>

          {/* Payment Progress */}
          {purchaseMutation.isPending && (
            <div className="space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Transaction Progress
              </h4>
              
              <div className="space-y-3">
                {paymentSteps.map((step, index) => (
                  <div 
                    key={step.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${
                      step.status === "active" ? "bg-blue-50 border-blue-200" :
                      step.status === "completed" ? "bg-green-50 border-green-200" :
                      step.status === "error" ? "bg-red-50 border-red-200" :
                      "bg-gray-50 border-gray-200"
                    }`}
                  >
                    {getStepIcon(step)}
                    <div className="flex-1">
                      <div className="font-medium text-sm">{step.title}</div>
                      <div className="text-xs text-muted-foreground">{step.description}</div>
                    </div>
                  </div>
                ))}
              </div>

              {transactionHash && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Transaction Hash:</span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => window.open(`https://hashscan.io/mainnet/transaction/${transactionHash}`, '_blank')}
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
              disabled={purchaseMutation.isPending}
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
                  Pay {total.toFixed(4)} ℏ
                </>
              )}
            </Button>
          </div>

          {/* Security Notice */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-3 h-3" />
              <span>Secure payment powered by Hedera Hashgraph</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}