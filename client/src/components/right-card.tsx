import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, TrendingUp, Sparkles, ArrowRight, FileCheck } from "lucide-react";
import { VerificationBadge, TrustScore } from "./verification-badge";
import type { RightWithCreator } from "@shared/schema";
import { rightTypeSymbols, rightTypeLabels } from "@shared/schema";

interface RightCardProps {
  right: RightWithCreator;
}

export function RightCard({ right }: RightCardProps) {
  const rightSymbol = rightTypeSymbols[right.type as keyof typeof rightTypeSymbols] || "📄";
  const rightLabel = rightTypeLabels[right.type as keyof typeof rightTypeLabels] || "Unknown";

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "copyright":
        return "bg-gradient-to-r from-blue-500/10 to-blue-600/10 text-blue-700 border border-blue-200 hover:from-blue-500/20 hover:to-blue-600/20";
      case "royalty":
        return "bg-gradient-to-r from-green-500/10 to-green-600/10 text-green-700 border border-green-200 hover:from-green-500/20 hover:to-green-600/20";
      case "access":
        return "bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 text-yellow-700 border border-yellow-200 hover:from-yellow-500/20 hover:to-yellow-600/20";
      case "ownership":
        return "bg-gradient-to-r from-purple-500/10 to-purple-600/10 text-purple-700 border border-purple-200 hover:from-purple-500/20 hover:to-purple-600/20";
      case "license":
        return "bg-gradient-to-r from-orange-500/10 to-orange-600/10 text-orange-700 border border-orange-200 hover:from-orange-500/20 hover:to-orange-600/20";
      default:
        return "bg-gradient-to-r from-gray-500/10 to-gray-600/10 text-gray-700 border border-gray-200 hover:from-gray-500/20 hover:to-gray-600/20";
    }
  };

  return (
    <Card className="rights-card-hover cursor-pointer group relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:-translate-y-1 animate-fade-in-up">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <CardContent className="p-6 relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 group-hover:animate-pulse-glow">
              <span className="text-2xl transition-transform duration-300 group-hover:scale-110">{rightSymbol}</span>
            </div>
            <div className="flex flex-col gap-2">
              <Badge className={`${getBadgeColor(right.type)} transition-all duration-300 hover:scale-105`}>
                {rightLabel}
              </Badge>
              <VerificationBadge 
                status={right.verificationStatus as "pending" | "verified" | "rejected" || "pending"} 
                size="sm" 
              />
            </div>
          </div>
          <div className="flex items-center space-x-1">
            {right.paysDividends ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 transition-all duration-300 hover:bg-accent/20 hover:scale-105">
                <Sparkles className="w-3 h-3 text-accent animate-pulse" />
                <span className="text-xs text-accent font-medium">Earning</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 transition-all duration-300 hover:bg-muted/70">
                <X className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground font-medium">No Income</span>
              </div>
            )}
          </div>
        </div>
        
        <h3 className="font-bold text-lg text-foreground mb-3 line-clamp-2 group-hover:text-primary transition-colors duration-300">
          {right.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-6 line-clamp-3 leading-relaxed transition-all duration-300 group-hover:text-foreground/80">
          {right.description}
        </p>
        
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-muted-foreground">
            {right.paysDividends ? (
              <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 transition-all duration-300 hover:bg-primary/20 hover:scale-105">
                <TrendingUp className="w-3 h-3 text-primary transition-transform duration-300 group-hover:scale-110" />
                <span className="text-primary font-medium">{right.paymentFrequency} dividends</span>
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-muted/50 text-xs transition-all duration-300 hover:bg-muted/70">One-time purchase</span>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gradient transition-all duration-300 group-hover:scale-105">
              {right.price} {right.currency}
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-border/50">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-muted-foreground flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-bold text-primary">{right.creator.username.charAt(0).toUpperCase()}</span>
              </div>
              by {right.creator.username}
            </div>
            <TrustScore 
              verificationStatus={right.verificationStatus as "pending" | "verified" | "rejected" || "pending"}
              hasContentFile={!!right.contentFileHash}
              creatorVerified={right.creator.isVerified || false}
              className="text-xs"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {right.contentFileHash && (
                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                  <FileCheck className="w-3 h-3" />
                  <span>Content Verified</span>
                </div>
              )}
            </div>
            <Link href={`/rights/${right.id}`}>
              <Button size="sm" className="opacity-0 group-hover:opacity-100 transition-all hover:scale-105 glow-primary">
                View Details
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
      
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
    </Card>
  );
}
