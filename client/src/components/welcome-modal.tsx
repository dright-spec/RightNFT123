import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  DollarSign, 
  PlayCircle,
  ArrowRight,
  Sparkles,
  Star
} from "lucide-react";

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartTour: () => void;
}

export default function WelcomeModal({ isOpen, onClose, onStartTour }: WelcomeModalProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Welcome to Dright!",
      subtitle: "Turn Your Creative Rights into Smart Investments",
      content: (
        <div className="text-center space-y-6">
          <div className="relative mx-auto w-24 h-24">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-xl">
              🚀
            </div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-30"></div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full animate-bounce flex items-center justify-center">
              ✨
            </div>
          </div>
          
          <div className="space-y-3">
            <p className="text-lg text-muted-foreground">
              Transform your creative works into liquid investments with blockchain-guaranteed ownership
            </p>
            
            <div className="grid grid-cols-2 gap-4 mt-6">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                <CardContent className="p-4 text-center">
                  <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="font-semibold text-sm">90% Lower</div>
                  <div className="text-xs text-muted-foreground">Legal Costs</div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-4 text-center">
                  <Zap className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="font-semibold text-sm">Instant</div>
                  <div className="text-xs text-muted-foreground">Global Market</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "How It Works",
      subtitle: "Three Simple Steps to Start Investing",
      content: (
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              1
            </div>
            <div>
              <h4 className="font-semibold mb-2">Browse Investment Opportunities</h4>
              <p className="text-sm text-muted-foreground">
                Explore verified rights from YouTube channels, music tracks, patents, and more. Filter by yield potential and risk profile.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              2
            </div>
            <div>
              <h4 className="font-semibold mb-2">Purchase Rights Securely</h4>
              <p className="text-sm text-muted-foreground">
                Buy through fixed prices or participate in auctions. All transactions are secured by blockchain technology.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              3
            </div>
            <div>
              <h4 className="font-semibold mb-2">Earn Ongoing Returns</h4>
              <p className="text-sm text-muted-foreground">
                Receive automatic dividend payments and benefit from value appreciation as your rights portfolio grows.
              </p>
            </div>
          </div>
          
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-blue-600" />
                <div>
                  <div className="font-semibold text-sm">Blockchain Protected</div>
                  <div className="text-xs text-muted-foreground">Every investment is secured on Ethereum</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      title: "Ready to Start?",
      subtitle: "Let me show you around the marketplace",
      content: (
        <div className="text-center space-y-6">
          <div className="relative mx-auto w-20 h-20">
            <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-xl">
              🎯
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full animate-bounce flex items-center justify-center text-xs">
              ⭐
            </div>
          </div>
          
          <div className="space-y-4">
            <p className="text-lg text-muted-foreground">
              I'll guide you through finding the perfect investment opportunities and show you all the key features.
            </p>
            
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <span className="font-semibold text-sm">Interactive Tour Includes:</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Star className="w-3 h-3 text-yellow-500" />
                  <span>Smart Filters</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-3 h-3 text-yellow-500" />
                  <span>Investment Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-3 h-3 text-yellow-500" />
                  <span>Wallet Connection</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-3 h-3 text-yellow-500" />
                  <span>Market Activity</span>
                </div>
              </div>
            </div>
            
            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-4 py-2">
              Takes about 2 minutes
            </Badge>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleStartTour = () => {
    onStartTour();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{slides[currentSlide].title}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {slides[currentSlide].subtitle}
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {currentSlide + 1} of {slides.length}
            </Badge>
          </div>
        </DialogHeader>

        <div className="py-6">
          {slides[currentSlide].content}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full bg-muted rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div>
            {currentSlide > 0 && (
              <Button variant="outline" onClick={handlePrev}>
                Previous
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose}>
              Skip
            </Button>
            
            {currentSlide < slides.length - 1 ? (
              <Button onClick={handleNext} className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleStartTour} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
                <PlayCircle className="w-4 h-4 mr-2" />
                Start Tour
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}