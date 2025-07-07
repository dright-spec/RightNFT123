import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Heart, Eye, TrendingUp, Clock, Shield } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { presets, staggerDelays, specialEffects, animationClasses } from "@/lib/animations";
import { rightTypeSymbols } from "@shared/schema";
import type { RightWithCreator } from "@shared/schema";

interface AnimatedRightCardProps {
  right: RightWithCreator;
  index: number;
  showBidding?: boolean;
  variant?: "grid" | "list" | "featured";
}

export function AnimatedRightCard({ 
  right, 
  index, 
  showBidding = true, 
  variant = "grid" 
}: AnimatedRightCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorited, setIsFavorited] = useState(right.isFavorited || false);

  const typeSymbol = rightTypeSymbols[right.type as keyof typeof rightTypeSymbols] || "📄";
  const isHighValue = parseFloat(right.price || "0") > 10;
  const isVerified = right.verificationStatus === "verified";

  // Animation styles based on index and state
  const cardAnimation = {
    ...staggerDelays.rightCard(index),
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  };

  // Determine special effects
  const getSpecialEffect = () => {
    if (isVerified && isHighValue) return specialEffects.highValue;
    if (isVerified) return specialEffects.verified;
    if (right.verificationStatus === "pending") return specialEffects.pending;
    return "";
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorited(!isFavorited);
    // Add pulse animation on click
    const target = e.currentTarget as HTMLElement;
    target.classList.add("animate-pulse");
    setTimeout(() => target.classList.remove("animate-pulse"), 300);
  };

  const cardClasses = `
    ${presets.rightCard} 
    ${getSpecialEffect()}
    ${isHovered ? 'scale-105 shadow-2xl -translate-y-2' : ''}
    ${variant === "featured" ? 'ring-2 ring-primary/20' : ''}
    group cursor-pointer overflow-hidden
    ${animationClasses.smooth}
  `.trim();

  return (
    <Link href={`/rights/${right.id}`}>
      <Card 
        className={cardClasses}
        style={cardAnimation}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Section with Overlay */}
        <div className="relative overflow-hidden">
          <div className={`
            aspect-video bg-gradient-to-br from-primary/20 to-secondary/20 
            flex items-center justify-center text-4xl
            ${presets.rightImage}
            ${isHovered ? 'scale-110' : 'scale-100'}
          `}>
            <span className={`${animationClasses.float} ${isHovered ? 'animate-bounce' : ''}`}>
              {typeSymbol}
            </span>
          </div>
          
          {/* Hover Overlay */}
          <div className={`
            absolute inset-0 bg-black/60 opacity-0 transition-opacity duration-300
            flex items-center justify-center
            ${isHovered ? 'opacity-100' : ''}
          `}>
            <Button 
              variant="secondary" 
              size="sm"
              className={`${animationClasses.scaleIn} ${isHovered ? 'animate-bounce-in' : ''}`}
            >
              View Details
            </Button>
          </div>

          {/* Status Badge */}
          <div className="absolute top-2 left-2">
            <Badge 
              variant={isVerified ? "default" : "secondary"}
              className={`${presets.rightStatus} ${isVerified ? specialEffects.verified : ''}`}
            >
              {isVerified && <Shield className="w-3 h-3 mr-1" />}
              {right.verificationStatus}
            </Badge>
          </div>

          {/* Favorite Button */}
          <button
            onClick={handleFavoriteClick}
            className={`
              absolute top-2 right-2 p-2 rounded-full bg-white/20 backdrop-blur-sm
              ${animationClasses.iconHover}
              ${isFavorited ? 'text-red-500' : 'text-white'}
              opacity-0 group-hover:opacity-100 transition-opacity duration-300
            `}
          >
            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
          </button>
        </div>

        <CardHeader className="pb-2">
          <div className="space-y-2">
            {/* Title with animation */}
            <h3 className={`
              font-semibold text-lg line-clamp-2 
              ${presets.rightDetails}
              ${isHovered ? 'text-primary' : ''}
            `}>
              {right.title}
            </h3>
            
            {/* Creator info with micro-animation */}
            <div className={`flex items-center space-x-2 text-sm text-muted-foreground ${animationClasses.fadeIn}`}>
              <span>by {right.creator.username}</span>
              {right.creator.isVerified && (
                <Shield className={`w-3 h-3 text-blue-500 ${animationClasses.float}`} />
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {/* Description */}
          <p className={`text-sm text-muted-foreground line-clamp-2 mb-4 ${presets.rightDetails}`}>
            {right.description}
          </p>

          {/* Price and Stats Row */}
          <div className="flex items-center justify-between mb-4">
            <div className={`${presets.rightPrice} ${isHighValue ? specialEffects.highValue : ''}`}>
              <span className="text-2xl font-bold">{right.price}</span>
              <span className="text-sm text-muted-foreground ml-1">{right.currency}</span>
            </div>
            
            <div className="flex items-center space-x-3 text-sm text-muted-foreground">
              <div className={`flex items-center space-x-1 ${animationClasses.iconHover}`}>
                <Eye className="w-4 h-4" />
                <span>{Math.floor(Math.random() * 1000)}</span>
              </div>
              {right.paysDividends && (
                <div className={`flex items-center space-x-1 text-green-600 ${animationClasses.pulseGlow}`}>
                  <TrendingUp className="w-4 h-4" />
                  <span>Dividends</span>
                </div>
              )}
            </div>
          </div>

          {/* Auction Info */}
          {showBidding && right.listingType === "auction" && (
            <div className={`
              p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800
              ${animationClasses.fadeInUp}
            `}>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-orange-600 dark:text-orange-400">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Ends in 2d 5h</span>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Current bid</div>
                  <div className="font-semibold">
                    {parseFloat(right.price || "0") * 1.2} {right.currency}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className={`flex space-x-2 mt-4 ${animationClasses.fadeInUp}`}>
            <Button 
              className={`flex-1 ${presets.button}`} 
              variant={right.listingType === "auction" ? "outline" : "default"}
            >
              {right.listingType === "auction" ? "Place Bid" : "Buy Now"}
            </Button>
            <Button 
              variant="outline" 
              size="icon"
              className={animationClasses.iconHover}
            >
              <Heart className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Grid wrapper component for staggered animations
interface AnimatedRightGridProps {
  rights: RightWithCreator[];
  variant?: "grid" | "list" | "featured";
}

export function AnimatedRightGrid({ rights, variant = "grid" }: AnimatedRightGridProps) {
  return (
    <div className={`
      grid gap-6
      ${variant === "grid" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : ""}
      ${variant === "list" ? "grid-cols-1 max-w-4xl mx-auto" : ""}
      ${variant === "featured" ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : ""}
    `}>
      {rights.map((right, index) => (
        <div 
          key={right.id}
          className={`${presets.rightGrid}`}
          style={staggerDelays.marketplace(index)}
        >
          <AnimatedRightCard 
            right={right} 
            index={index} 
            variant={variant}
          />
        </div>
      ))}
    </div>
  );
}

export default AnimatedRightCard;