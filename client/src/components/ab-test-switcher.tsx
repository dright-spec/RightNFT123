import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TestTube, RotateCcw, Eye, BarChart3 } from "lucide-react";

interface ABTestSwitcherProps {
  onVariantChange: (variant: 'original' | 'minimalist') => void;
  currentVariant: 'original' | 'minimalist';
}

export function ABTestSwitcher({ onVariantChange, currentVariant }: ABTestSwitcherProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [viewCount, setViewCount] = useState({ original: 0, minimalist: 0 });

  useEffect(() => {
    // Show switcher only in development or for admins
    setIsVisible(import.meta.env.DEV || window.location.search.includes('admin=true'));
    
    // Load view counts from localStorage
    const counts = localStorage.getItem('ab-test-counts');
    if (counts) {
      setViewCount(JSON.parse(counts));
    }
  }, []);

  useEffect(() => {
    // Track view for current variant
    setViewCount(prev => {
      const updated = {
        ...prev,
        [currentVariant]: prev[currentVariant] + 1
      };
      localStorage.setItem('ab-test-counts', JSON.stringify(updated));
      return updated;
    });
  }, [currentVariant]);

  const resetCounts = () => {
    const reset = { original: 0, minimalist: 0 };
    setViewCount(reset);
    localStorage.setItem('ab-test-counts', JSON.stringify(reset));
  };

  if (!isVisible) return null;

  return (
    <Card className="fixed bottom-4 right-4 z-50 shadow-lg border-2 border-blue-200 bg-blue-50/95 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <TestTube className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-sm text-blue-900">A/B Test Control</span>
        </div>
        
        <div className="space-y-2 mb-3">
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={currentVariant === 'original' ? 'default' : 'outline'}
              onClick={() => onVariantChange('original')}
              className="flex-1 text-xs"
            >
              <Eye className="w-3 h-3 mr-1" />
              Original ({viewCount.original})
            </Button>
            <Button
              size="sm"
              variant={currentVariant === 'minimalist' ? 'default' : 'outline'}
              onClick={() => onVariantChange('minimalist')}
              className="flex-1 text-xs"
            >
              <BarChart3 className="w-3 h-3 mr-1" />
              Minimalist ({viewCount.minimalist})
            </Button>
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={resetCounts}
            className="w-full text-xs"
          >
            <RotateCcw className="w-3 h-3 mr-1" />
            Reset Counts
          </Button>
        </div>

        <div className="text-xs text-blue-700">
          <Badge variant="secondary" className="text-xs">
            Current: {currentVariant === 'original' ? 'Original Design' : 'Minimalist Design'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}