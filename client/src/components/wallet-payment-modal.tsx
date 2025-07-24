import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
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
      id: "wallet-connect",
      title: "Wallet Connection",
      description: "Connecting to your wallet",
      status: "active"
    },
    {
      id: "payment-approval",
      title: "Payment Approval", 
      description: "Approve the transaction in your wallet",
      status: "pending"
    },
    {
      id: "blockchain-confirmation",
      title: "Blockchain Confirmation",
      description: "Waiting for blockchain confirmation",
      status: "pending"
    },
    {
      id: "ownership-transfer",
      title: "Ownership Transfer",
      description: "Transferring right ownership to you",
      status: "pending"
    }
  ]);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Calculate fees and totals
  const price = parseFloat(right.price || "0");
  const platformFee = price * 0.025; // 2.5% platform fee
  const total = price + platformFee;

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async () => {
      // Check wallet connection
      const walletConnection = localStorage.getItem('walletConnection');
      if (!walletConnection) {
        throw new Error("Wallet not connected");
      }

      const walletData = JSON.parse(walletConnection);
      if (!walletData.address) {
        throw new Error("No wallet address found");
      }

      // Step 1: Connect wallet (already done)
      updateStepStatus(0, "completed");
      setCurrentStep(1);
      updateStepStatus(1, "active");

      // Step 2: Simulate payment transaction
      const mockTransactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      setTransactionHash(mockTransactionHash);

      updateStepStatus(1, "completed");
      setCurrentStep(2);
      updateStepStatus(2, "active");

      // Step 3: Wait for blockchain confirmation
      await new Promise(resolve => setTimeout(resolve, 2000));
      updateStepStatus(2, "completed");
      setCurrentStep(3);
      updateStepStatus(3, "active");

      // Step 4: Process purchase on backend
      const purchaseResult = await apiRequest("POST", `/api/rights/${right.id}/purchase`, {
        transactionHash: mockTransactionHash,
        amount: total.toString(),
        currency: "ETH",
        buyerAddress: walletData.address
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
      // Check wallet connection
      const walletConnection = localStorage.getItem('walletConnection');
      if (!walletConnection) {
        toast({
          title: "Wallet Not Connected",
          description: "Please connect your wallet first to make a purchase.",
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
                <span>{price.toFixed(4)} ETH</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Platform Fee (2.5%)</span>
                <span>{platformFee.toFixed(4)} ETH</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{total.toFixed(4)} ETH</span>
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
                      onClick={() => window.open(`https://etherscan.io/tx/${transactionHash}`, '_blank')}
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
                  Pay {total.toFixed(4)} ETH
                </>
              )}
            </Button>
          </div>

          {/* Security Notice */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-3 h-3" />
              <span>Secure payment powered by Ethereum blockchain</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}