import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, ArrowRight, ArrowLeft, Lightbulb, Zap, Shield, Coins } from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target: string;
  position: "top" | "bottom" | "left" | "right";
  action?: string;
  mascotExpression?: "excited" | "explaining" | "celebrating" | "thinking";
}

interface OnboardingTooltipProps {
  steps: OnboardingStep[];
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
  visible: boolean;
}

// Web3 Mascot Component
const Web3Mascot = ({ expression = "excited" }: { expression?: string }) => {
  const expressions = {
    excited: "😄",
    explaining: "🤓",
    celebrating: "🎉",
    thinking: "🤔"
  };

  return (
    <div className="relative">
      {/* Mascot Avatar */}
      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-lg">
        <span className="text-lg">{expressions[expression as keyof typeof expressions] || "😄"}</span>
      </div>
      
      {/* Animated Ring */}
      <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-30"></div>
      
      {/* Floating Particles */}
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-bounce"></div>
      <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
    </div>
  );
};

export default function OnboardingTooltip({
  steps,
  currentStep,
  onNext,
  onPrev,
  onSkip,
  onComplete,
  visible
}: OnboardingTooltipProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  useEffect(() => {
    if (!visible || !step) return;

    const target = document.querySelector(step.target) as HTMLElement;
    if (target) {
      setTargetElement(target);
      const rect = target.getBoundingClientRect();
      const tooltipWidth = 380;
      const tooltipHeight = 200;
      
      let top = 0;
      let left = 0;

      switch (step.position) {
        case "top":
          top = rect.top - tooltipHeight - 16;
          left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
          break;
        case "bottom":
          top = rect.bottom + 16;
          left = rect.left + (rect.width / 2) - (tooltipWidth / 2);
          break;
        case "left":
          top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
          left = rect.left - tooltipWidth - 16;
          break;
        case "right":
          top = rect.top + (rect.height / 2) - (tooltipHeight / 2);
          left = rect.right + 16;
          break;
      }

      // Ensure tooltip stays within viewport
      top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16));
      left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));

      setPosition({ top, left });

      // Highlight target element
      target.style.position = "relative";
      target.style.zIndex = "1000";
      target.style.boxShadow = "0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3)";
      target.style.borderRadius = "8px";
      target.style.transition = "all 0.3s ease";
    }

    return () => {
      if (target) {
        target.style.position = "";
        target.style.zIndex = "";
        target.style.boxShadow = "";
        target.style.borderRadius = "";
      }
    };
  }, [step, visible, currentStep]);

  if (!visible || !step) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-[998]" onClick={onSkip} />
      
      {/* Tooltip */}
      <Card 
        className="fixed z-[999] w-96 shadow-2xl border-2 border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900"
        style={{ top: position.top, left: position.left }}
      >
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <Web3Mascot expression={step.mascotExpression} />
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                  {step.title}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  Step {currentStep + 1} of {steps.length}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onSkip}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
              {step.description}
            </p>
            
            {step.action && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Try this:
                  </span>
                </div>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {step.action}
                </p>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-2">
              <span>Progress</span>
              <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!isFirstStep && (
                <Button variant="outline" size="sm" onClick={onPrev}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Previous
                </Button>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={onSkip}>
                Skip Tour
              </Button>
              
              {isLastStep ? (
                <Button onClick={onComplete} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
                  Get Started!
                  <Zap className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={onNext} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>

        {/* Pointer Arrow */}
        <div 
          className={`absolute w-4 h-4 bg-white dark:bg-gray-900 border-2 border-blue-200 dark:border-blue-800 transform rotate-45 ${
            step.position === "top" ? "bottom-[-8px] left-1/2 -translate-x-1/2" :
            step.position === "bottom" ? "top-[-8px] left-1/2 -translate-x-1/2" :
            step.position === "left" ? "right-[-8px] top-1/2 -translate-y-1/2" :
            "left-[-8px] top-1/2 -translate-y-1/2"
          }`}
        />
      </Card>
    </>
  );
}

// Onboarding Steps Configuration
export const marketplaceOnboardingSteps: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Welcome to Dright! 👋",
    description: "I'm your Web3 guide! Let me show you how to turn your creative rights into profitable investments. This marketplace lets you buy and sell ownership of copyrights, royalties, and exclusive access rights.",
    target: "h1",
    position: "bottom",
    mascotExpression: "excited"
  },
  {
    id: "search",
    title: "Find Investment Opportunities",
    description: "Use this search bar to find specific rights, creators, or categories. You can search for YouTube channels, music tracks, patents, or any other creative assets that interest you.",
    target: "input[placeholder*='Search']",
    position: "bottom",
    action: "Try searching for 'YouTube' or 'music'",
    mascotExpression: "explaining"
  },
  {
    id: "filters",
    title: "Smart Investment Filters",
    description: "These filters help you find the perfect investment opportunity. Filter by budget range, revenue potential (dividends, royalties), risk profile, and asset categories.",
    target: "button:has(svg):contains('Investment Filters')",
    position: "bottom",
    action: "Click to see all available investment criteria",
    mascotExpression: "thinking"
  },
  {
    id: "tabs",
    title: "Explore Different Markets",
    description: "Switch between different types of opportunities: Explore all rights, Live Auctions for time-sensitive bidding, Buy Now for instant purchases, and Activity to track market trends.",
    target: "[role='tablist']",
    position: "bottom",
    action: "Try clicking the 'Live Auctions' tab",
    mascotExpression: "explaining"
  },
  {
    id: "rights-grid",
    title: "Investment Opportunities",
    description: "Each card represents a tradeable right. You'll see the price, yield potential, creator info, and whether it pays ongoing dividends. Click any card to see detailed information and purchase options.",
    target: "[data-testid='rights-grid'], .grid:has(.animate-pulse), .space-y-6:has(h3)",
    position: "top",
    action: "Click on any right to view detailed investment information",
    mascotExpression: "excited"
  },
  {
    id: "wallet",
    title: "Connect Your Wallet",
    description: "To buy rights and start investing, connect your MetaMask wallet. This ensures secure transactions and proves ownership of your digital assets on the Ethereum blockchain.",
    target: "button:contains('Connect Wallet'), button:contains('MetaMask')",
    position: "left",
    action: "Click to connect your MetaMask wallet",
    mascotExpression: "explaining"
  },
  {
    id: "complete",
    title: "You're Ready to Invest! 🎉",
    description: "Now you know how to navigate the marketplace, find profitable opportunities, and make secure investments. Start with small amounts and gradually build your rights portfolio!",
    target: "body",
    position: "bottom",
    mascotExpression: "celebrating"
  }
];

export const createRightOnboardingSteps: OnboardingStep[] = [
  {
    id: "welcome-create",
    title: "Turn Your Rights into Money! 💰",
    description: "Ready to tokenize your creative work? I'll guide you through creating your first rights NFT. You can sell copyrights, set up ongoing royalties, or offer exclusive access to your content.",
    target: "h1",
    position: "bottom",
    mascotExpression: "excited"
  },
  {
    id: "content-source",
    title: "Choose Your Content Type",
    description: "Select what type of creative work you're tokenizing. YouTube videos get instant verification, while other content types go through our secure review process.",
    target: "[data-testid='content-source-grid'], .grid:has(input[type='radio'])",
    position: "bottom",
    action: "Select the type that matches your content",
    mascotExpression: "explaining"
  },
  {
    id: "verification",
    title: "Ownership Verification",
    description: "This is crucial for authenticity! For YouTube content, we'll verify you own the channel. For other content, provide proof of ownership like certificates, receipts, or creation records.",
    target: "[data-testid='verification-section']",
    position: "top",
    action: "Follow the verification steps carefully",
    mascotExpression: "thinking"
  },
  {
    id: "pricing",
    title: "Set Your Investment Terms",
    description: "Choose between fixed-price sales or auctions. Set dividend percentages if you want ongoing revenue sharing. Remember: higher yields attract more investors!",
    target: "[data-testid='pricing-section']",
    position: "top",
    action: "Consider what pricing strategy works best for your content",
    mascotExpression: "explaining"
  },
  {
    id: "submit",
    title: "Launch Your Investment! 🚀",
    description: "Once submitted, your right will be reviewed (if needed) and then minted as an NFT. After verification, it becomes available for investors to purchase on the marketplace.",
    target: "button[type='submit']",
    position: "top",
    action: "Click to create your rights NFT",
    mascotExpression: "celebrating"
  }
];