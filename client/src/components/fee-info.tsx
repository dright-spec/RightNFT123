import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Percent } from "lucide-react";

interface FeeInfoProps {
  variant?: "compact" | "detailed";
  className?: string;
}

export function FeeInfo({ variant = "compact", className }: FeeInfoProps) {
  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        <Percent className="w-4 h-4" />
        <span>Standard marketplace fee: 7-10% on successful sales</span>
      </div>
    );
  }

  return (
    <Card className={`border-green-200 bg-green-50/50 ${className}`}>
      <CardContent className="pt-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-green-600" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-green-800">Transparent Pricing</h4>
              <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                7-10% Success Fee
              </Badge>
            </div>
            <div className="space-y-1 text-sm text-green-700">
              <p className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3" />
                No upfront costs - only pay when you sell
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3" />
                Keep 90-93% of your sale proceeds
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle className="w-3 h-3" />
                Includes verification, minting, and marketplace services
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}