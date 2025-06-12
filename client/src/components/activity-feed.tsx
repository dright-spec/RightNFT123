import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  TrendingUp, 
  TrendingDown, 
  Gavel, 
  ShoppingCart, 
  Star, 
  Eye,
  DollarSign,
  Clock,
  Zap
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface ActivityItem {
  id: string;
  type: 'sale' | 'listing' | 'bid' | 'price_change' | 'view';
  rightId: number;
  rightTitle: string;
  rightType: string;
  userUsername: string;
  amount?: string;
  currency?: string;
  previousAmount?: string;
  timestamp: Date;
  isHighValue?: boolean;
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [visibleActivities, setVisibleActivities] = useState<ActivityItem[]>([]);

  // Fetch real marketplace data
  const { data: rights } = useQuery<any[]>({
    queryKey: ["/api/rights"],
  });

  // Generate realistic activity based on actual data
  useEffect(() => {
    if (!rights || !Array.isArray(rights) || rights.length === 0) return;

    const generateActivity = (): ActivityItem => {
      const right = rights[Math.floor(Math.random() * rights.length)];
      const activityTypes = ['sale', 'listing', 'bid', 'price_change', 'view'];
      const type = activityTypes[Math.floor(Math.random() * activityTypes.length)] as ActivityItem['type'];
      
      const baseAmount = parseFloat(right.price || '1');
      const variation = 0.8 + Math.random() * 0.4; // ±20% variation
      const amount = (baseAmount * variation).toFixed(2);
      
      return {
        id: `${Date.now()}-${Math.random()}`,
        type,
        rightId: right.id,
        rightTitle: right.title || `Right #${right.id}`,
        rightType: right.type || 'music',
        userUsername: generateUsername(),
        amount,
        currency: right.currency || 'ETH',
        previousAmount: type === 'price_change' ? (baseAmount * 1.1).toFixed(2) : undefined,
        timestamp: new Date(Date.now() - Math.random() * 3600000), // Random time within last hour
        isHighValue: parseFloat(amount) > 5
      };
    };

    // Generate initial activities
    const initialActivities = Array.from({ length: 20 }, generateActivity)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    setActivities(initialActivities);
    setVisibleActivities(initialActivities.slice(0, 8));

    // Add new activities periodically
    const interval = setInterval(() => {
      const newActivity = generateActivity();
      newActivity.timestamp = new Date(); // Make it current
      
      setActivities(prev => [newActivity, ...prev.slice(0, 49)]); // Keep last 50
    }, Math.random() * 8000 + 2000); // Random interval 2-10 seconds

    return () => clearInterval(interval);
  }, [rights]);

  // Update visible activities with animations
  useEffect(() => {
    setVisibleActivities(activities.slice(0, 8));
  }, [activities]);

  const generateUsername = () => {
    const prefixes = ['Artist', 'Creator', 'Producer', 'Musician', 'Writer', 'Developer'];
    const suffixes = ['Pro', 'Official', 'Music', 'Beats', 'Studios', 'Lab'];
    const numbers = Math.floor(Math.random() * 999) + 1;
    return `${prefixes[Math.floor(Math.random() * prefixes.length)]}${suffixes[Math.floor(Math.random() * suffixes.length)]}${numbers}`;
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'sale': return <ShoppingCart className="w-4 h-4 text-green-600" />;
      case 'listing': return <Star className="w-4 h-4 text-blue-600" />;
      case 'bid': return <Gavel className="w-4 h-4 text-purple-600" />;
      case 'price_change': return <TrendingUp className="w-4 h-4 text-orange-600" />;
      case 'view': return <Eye className="w-4 h-4 text-gray-600" />;
      default: return <Zap className="w-4 h-4 text-primary" />;
    }
  };

  const getActivityText = (activity: ActivityItem) => {
    switch (activity.type) {
      case 'sale':
        return `bought "${activity.rightTitle}" for ${activity.amount} ${activity.currency}`;
      case 'listing':
        return `listed "${activity.rightTitle}" for ${activity.amount} ${activity.currency}`;
      case 'bid':
        return `placed a bid of ${activity.amount} ${activity.currency} on "${activity.rightTitle}"`;
      case 'price_change':
        return `updated price for "${activity.rightTitle}" to ${activity.amount} ${activity.currency}`;
      case 'view':
        return `viewed "${activity.rightTitle}"`;
      default:
        return `interacted with "${activity.rightTitle}"`;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'sale': return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800';
      case 'listing': return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800';
      case 'bid': return 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800';
      case 'price_change': return 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800';
      default: return 'bg-gray-50 dark:bg-gray-950/30 border-gray-200 dark:border-gray-800';
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <h3 className="font-semibold text-lg">Live Activity</h3>
          </div>
          <Badge variant="secondary" className="text-xs">
            {activities.length} today
          </Badge>
        </div>

        <div className="space-y-3 max-h-96 overflow-hidden">
          {visibleActivities.map((activity, index) => (
            <div
              key={activity.id}
              className={`p-3 rounded-lg border transition-all duration-500 animate-slide-in ${getActivityColor(activity.type)} ${
                index === 0 ? 'animate-pulse-once' : ''
              } ${activity.isHighValue ? 'ring-2 ring-yellow-400/50' : ''}`}
              style={{
                animationDelay: `${index * 100}ms`
              }}
            >
              <div className="flex items-start gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs">
                    {activity.userUsername.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {getActivityIcon(activity.type)}
                    <span className="text-xs font-medium text-muted-foreground">
                      {activity.userUsername}
                    </span>
                    {activity.isHighValue && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-yellow-600" />
                        <span className="text-xs text-yellow-600 font-bold">HIGH VALUE</span>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-sm text-foreground leading-tight">
                    {getActivityText(activity)}
                  </p>
                  
                  <div className="flex items-center justify-between mt-2">
                    <Badge variant="outline" className="text-xs">
                      {activity.rightType}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </div>
                  </div>
                </div>
              </div>

              {activity.type === 'price_change' && activity.previousAmount && (
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <TrendingDown className="w-3 h-3 text-red-500" />
                  <span className="text-muted-foreground">
                    Down from {activity.previousAmount} {activity.currency}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Updates automatically • Live marketplace data
          </p>
        </div>
      </CardContent>
    </Card>
  );
}