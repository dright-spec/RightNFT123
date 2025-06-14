import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle, AlertTriangle, Zap } from "lucide-react";

interface VerificationStatusBadgeProps {
  status: string;
  hasFiles?: boolean;
  isYouTubeVerified?: boolean;
  className?: string;
}

export function VerificationStatusBadge({ 
  status, 
  hasFiles = false, 
  isYouTubeVerified = false,
  className 
}: VerificationStatusBadgeProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'verified':
        return {
          icon: CheckCircle,
          label: isYouTubeVerified ? 'Auto-Verified' : 'Verified',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-300'
        };
      case 'pending':
        return {
          icon: Clock,
          label: hasFiles ? 'Under Review' : 'Awaiting Files',
          variant: 'secondary' as const,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-300'
        };
      case 'rejected':
        return {
          icon: XCircle,
          label: 'Rejected',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-300'
        };
      case 'incomplete':
        return {
          icon: AlertTriangle,
          label: 'Incomplete',
          variant: 'outline' as const,
          className: 'bg-orange-100 text-orange-800 border-orange-300'
        };
      default:
        return {
          icon: Clock,
          label: 'Not Submitted',
          variant: 'outline' as const,
          className: 'bg-gray-100 text-gray-600 border-gray-300'
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant} 
      className={`${config.className} ${className}`}
    >
      <Icon className="w-3 h-3 mr-1" />
      {config.label}
      {isYouTubeVerified && (
        <Zap className="w-3 h-3 ml-1" />
      )}
    </Badge>
  );
}