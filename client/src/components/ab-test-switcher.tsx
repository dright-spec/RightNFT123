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
    <div className="fixed top-4 right-4 z-50">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onVariantChange(currentVariant === 'original' ? 'minimalist' : 'original')}
        className="text-xs px-3 py-1 h-8 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm border border-gray-200/50 dark:border-gray-800/50 hover:bg-white dark:hover:bg-gray-900 shadow-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        title={`Switch to ${currentVariant === 'original' ? 'minimalist' : 'original'} design`}
      >
        <TestTube className="w-3 h-3 mr-1" />
        {currentVariant === 'original' ? 'Min' : 'Orig'}
      </Button>
    </div>
  );
}