import { Badge } from "@/components/ui/badge";
import { Shield, Clock, X, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerificationBadgeProps {
  status: "pending" | "verified" | "rejected";
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

export function VerificationBadge({ 
  status, 
  size = "sm", 
  showIcon = true, 
  className 
}: VerificationBadgeProps) {
  const getVariantAndContent = () => {
    switch (status) {
      case "verified":
        return {
          variant: "default" as const,
          text: "Verified",
          icon: <CheckCircle className="w-3 h-3" />,
          bgClass: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
        };
      case "pending":
        return {
          variant: "secondary" as const,
          text: "Under Review",
          icon: <Clock className="w-3 h-3" />,
          bgClass: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
        };
      case "rejected":
        return {
          variant: "destructive" as const,
          text: "Rejected",
          icon: <X className="w-3 h-3" />,
          bgClass: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
        };
      default:
        return {
          variant: "secondary" as const,
          text: "Unknown",
          icon: <Shield className="w-3 h-3" />,
          bgClass: "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800",
        };
    }
  };

  const { text, icon, bgClass } = getVariantAndContent();
  
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  return (
    <Badge 
      className={cn(
        "inline-flex items-center gap-1.5 font-medium border",
        bgClass,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && icon}
      {text}
    </Badge>
  );
}

interface TrustScoreProps {
  verificationStatus: "pending" | "verified" | "rejected";
  hasContentFile?: boolean;
  creatorVerified?: boolean;
  className?: string;
}

export function TrustScore({ 
  verificationStatus, 
  hasContentFile = false, 
  creatorVerified = false,
  className 
}: TrustScoreProps) {
  const calculateScore = () => {
    let score = 0;
    
    // Base verification status
    if (verificationStatus === "verified") score += 60;
    else if (verificationStatus === "pending") score += 20;
    
    // Content file uploaded
    if (hasContentFile) score += 25;
    
    // Creator verification
    if (creatorVerified) score += 15;
    
    return Math.min(score, 100);
  };

  const score = calculateScore();
  
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 40) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "High Trust";
    if (score >= 60) return "Medium Trust";
    if (score >= 40) return "Low Trust";
    return "Unverified";
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-1">
        <Shield className={cn("w-4 h-4", getScoreColor(score))} />
        <span className={cn("text-sm font-medium", getScoreColor(score))}>
          {score}%
        </span>
      </div>
      <span className="text-xs text-muted-foreground">
        {getScoreLabel(score)}
      </span>
    </div>
  );
}