import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, TrendingUp } from "lucide-react";
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
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "royalty":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "access":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "ownership":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      case "license":
        return "bg-orange-100 text-orange-800 hover:bg-orange-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  return (
    <Card className="rights-card-hover cursor-pointer group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{rightSymbol}</span>
            <Badge className={getBadgeColor(right.type)}>
              {rightLabel}
            </Badge>
          </div>
          <div className="flex items-center space-x-1">
            {right.paysDividends ? (
              <>
                <Check className="w-4 h-4 text-accent" />
                <span className="text-sm text-accent font-medium">Earning</span>
              </>
            ) : (
              <>
                <X className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground font-medium">No Income</span>
              </>
            )}
          </div>
        </div>
        
        <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {right.title}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {right.description}
        </p>
        
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {right.paysDividends ? (
              <span className="flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {right.paymentFrequency} dividends
              </span>
            ) : (
              <span>One-time purchase</span>
            )}
          </div>
          <div className="text-lg font-bold text-primary">
            {right.price} {right.currency}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              by {right.creator.username}
            </div>
            <Link href={`/rights/${right.id}`}>
              <Button size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                View Details
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
