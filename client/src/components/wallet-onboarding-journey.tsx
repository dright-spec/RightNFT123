import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Wallet, TrendingUp, Shield, Zap, ArrowRight, CheckCircle, Upload, DollarSign, Users, Globe, Star } from "lucide-react";
import { Link } from "wouter";

interface OnboardingJourneyProps {
  isOpen: boolean;
  onClose: () => void;
  onWalletConnect: () => void;
}

export function WalletOnboardingJourney({ isOpen, onClose, onWalletConnect }: OnboardingJourneyProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);

  const steps = [
    {
      title: "Welcome to the Future of Rights Trading",
      description: "Join thousands of creators earning from their intellectual property",
      icon: Star,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-700 dark:text-green-300 text-sm font-medium mb-4">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              Platform Highlights
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30 rounded-lg">
                <DollarSign className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">$2.4M+</div>
                <div className="text-sm text-blue-700 dark:text-blue-300">Total Value Traded</div>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30 rounded-lg">
                <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">5,000+</div>
                <div className="text-sm text-purple-700 dark:text-purple-300">Active Creators</div>
              </div>
              <div className="p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30 rounded-lg">
                <Globe className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-emerald-600">150+</div>
                <div className="text-sm text-emerald-700 dark:text-emerald-300">Countries</div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-muted-foreground mb-3">
                <strong>Transform Your Rights Into Income:</strong> Turn music royalties, patents, real estate, and more into tradeable digital assets with instant global market access.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Badge variant="secondary" className="text-xs">90% Reduced Legal Costs</Badge>
                <Badge variant="secondary" className="text-xs">Instant Global Access</Badge>
                <Badge variant="secondary" className="text-xs">24/7 Automated Revenue</Badge>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Connect Your Wallet",
      description: "Secure, decentralized access to the marketplace",
      icon: Wallet,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-10 h-10 text-primary" />
            </div>
            <p className="text-muted-foreground mb-6">
              Your wallet is your secure digital identity. It keeps your rights and earnings completely under your control.
            </p>
          </div>

          <div className="grid gap-4">
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Shield className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium">100% Secure</div>
                <div className="text-sm text-muted-foreground">You own your private keys</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Zap className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium">Instant Transactions</div>
                <div className="text-sm text-muted-foreground">Buy and sell rights immediately</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <div>
                <div className="font-medium">Automatic Earnings</div>
                <div className="text-sm text-muted-foreground">Receive royalties directly to your wallet</div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>First Time?</strong> Don't worry! We'll guide you through installing a wallet if needed. It only takes 2 minutes.
            </p>
          </div>
        </div>
      )
    },
    {
      title: "Start Your Rights Journey",
      description: "Three ways to get started immediately",
      icon: Upload,
      content: (
        <div className="space-y-6">
          <div className="grid gap-4">
            <Link href="/create-right">
              <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-2 border-primary/20 hover:border-primary/40">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">Create Your First Right</h3>
                      <p className="text-sm text-muted-foreground">Upload YouTube videos, music, patents, or other intellectual property</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/marketplace">
              <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-2 border-accent/20 hover:border-accent/40">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-accent/20 to-accent/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">Explore Marketplace</h3>
                      <p className="text-sm text-muted-foreground">Browse and invest in rights from creators worldwide</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-accent transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/docs">
              <Card className="group cursor-pointer hover:shadow-lg transition-all duration-300 border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-900/30 dark:to-purple-800/30 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Shield className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">Learn the System</h3>
                      <p className="text-sm text-muted-foreground">Understand legal frameworks and earning potential</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-purple-600 transition-colors" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800 dark:text-green-200">Pro Tip</span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">
              Start by exploring the marketplace to see what others are earning. Then create your first right to join the ecosystem!
            </p>
          </div>
        </div>
      )
    }
  ];

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStart = () => {
    setHasStarted(true);
    setCurrentStep(0);
  };

  const handleConnectWallet = () => {
    onWalletConnect();
    if (currentStep === 1) {
      handleNext();
    }
  };

  const handleComplete = () => {
    onClose();
    // Mark user as having completed onboarding
    localStorage.setItem('dright_onboarding_completed', 'true');
  };

  if (!hasStarted) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-center">Welcome to Dright! 🎉</DialogTitle>
            <DialogDescription className="text-center text-lg">
              Ready to turn your creative rights into liquid, tradeable assets?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-6">
            <div className="text-center">
              <div className="text-6xl mb-4">🚀</div>
              <p className="text-muted-foreground mb-6">
                Let's get you started with a quick 3-step journey to understand how Dright can transform your intellectual property into income-generating assets.
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <Button onClick={handleStart} size="lg" className="px-8">
                Start Journey
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" onClick={onClose} size="lg">
                Skip for Now
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between mb-2">
            <DialogTitle className="flex items-center gap-3 text-xl">
              <currentStepData.icon className="w-6 h-6 text-primary" />
              {currentStepData.title}
            </DialogTitle>
            <Badge variant="secondary">
              Step {currentStep + 1} of {steps.length}
            </Badge>
          </div>
          <DialogDescription>
            {currentStepData.description}
          </DialogDescription>
          <Progress value={progress} className="mt-4" />
        </DialogHeader>
        
        <div className="py-6">
          {currentStepData.content}
        </div>

        <div className="flex justify-between pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={handlePrevious} 
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          
          <div className="flex gap-2">
            {currentStep === 1 ? (
              <Button onClick={handleConnectWallet} className="px-8">
                Connect Wallet
                <Wallet className="w-4 h-4 ml-2" />
              </Button>
            ) : currentStep === steps.length - 1 ? (
              <Button onClick={handleComplete} className="px-8">
                Start Trading!
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}