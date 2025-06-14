import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Eye, Clock, DollarSign, Percent, Zap, ArrowRight, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
  };
  publishedAt: string;
  viewCount: string;
  duration: string;
  channelTitle: string;
  channelId: string;
}

interface VideoPricing {
  videoId: string;
  listingType: 'fixed' | 'auction';
  price: string;
  currency: string;
  royaltyPercentage: number;
  paysDividends: boolean;
  // Auction specific fields
  startingBid?: string;
  reservePrice?: string;
  auctionDuration?: number; // in hours
}

interface MultiVideoPricingProps {
  videos: YouTubeVideo[];
  onPricingComplete: (pricingData: VideoPricing[]) => void;
}

export function MultiVideoPricing({ videos, onPricingComplete }: MultiVideoPricingProps) {
  const [pricing, setPricing] = useState<VideoPricing[]>(() => 
    videos.map(video => ({
      videoId: video.id,
      listingType: 'fixed' as const,
      price: "10",
      currency: "HBAR",
      royaltyPercentage: 7.5,
      paysDividends: false,
      startingBid: "1",
      reservePrice: "5",
      auctionDuration: 24
    }))
  );
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkListingType, setBulkListingType] = useState<'fixed' | 'auction'>('fixed');
  const [bulkPrice, setBulkPrice] = useState("10");
  const [bulkCurrency, setBulkCurrency] = useState("HBAR");
  const [bulkRoyalty, setBulkRoyalty] = useState(7.5);
  const [bulkStartingBid, setBulkStartingBid] = useState("1");
  const [bulkReservePrice, setBulkReservePrice] = useState("5");
  const [bulkDuration, setBulkDuration] = useState(24);
  const { toast } = useToast();

  const formatDuration = (duration: string) => {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return duration;
    
    const hours = match[1] ? parseInt(match[1]) : 0;
    const minutes = match[2] ? parseInt(match[2]) : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num: string) => {
    const number = parseInt(num);
    if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
    if (number >= 1000) return `${(number / 1000).toFixed(1)}K`;
    return number.toString();
  };

  const updateVideoPricing = (videoId: string, field: keyof VideoPricing, value: any) => {
    setPricing(prev => prev.map(p => 
      p.videoId === videoId ? { ...p, [field]: value } : p
    ));
  };

  const applyBulkPricing = () => {
    setPricing(prev => prev.map(p => ({
      ...p,
      listingType: bulkListingType,
      price: bulkPrice,
      currency: bulkCurrency,
      royaltyPercentage: bulkRoyalty,
      startingBid: bulkStartingBid,
      reservePrice: bulkReservePrice,
      auctionDuration: bulkDuration
    })));
    toast({
      title: "Bulk Settings Applied",
      description: `Applied ${bulkListingType === 'fixed' ? 'fixed price' : 'auction'} settings to all ${videos.length} videos`,
    });
  };

  const handleComplete = () => {
    const hasEmptyPrices = pricing.some(p => !p.price || parseFloat(p.price) <= 0);
    if (hasEmptyPrices) {
      toast({
        title: "Invalid Pricing",
        description: "Please set a valid price for all videos",
        variant: "destructive",
      });
      return;
    }

    onPricingComplete(pricing);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Set Pricing for {videos.length} NFTs
          </CardTitle>
          <CardDescription>
            Set individual prices and royalty rates for each video NFT. Minting is free - you only earn from future sales.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Bulk Pricing Controls */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Bulk Pricing</CardTitle>
              <CardDescription>Apply the same pricing to all videos quickly</CardDescription>
            </div>
            <Switch
              checked={bulkMode}
              onCheckedChange={setBulkMode}
            />
          </div>
        </CardHeader>
        {bulkMode && (
          <CardContent className="space-y-6">
            {/* Listing Type Selection */}
            <div>
              <Label className="text-base font-medium">Listing Type</Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <Card 
                  className={`cursor-pointer transition-all ${bulkListingType === 'fixed' ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'}`}
                  onClick={() => setBulkListingType('fixed')}
                >
                  <CardContent className="p-4 text-center">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <h4 className="font-medium">Fixed Price</h4>
                    <p className="text-sm text-muted-foreground">Set a specific price for immediate purchase</p>
                  </CardContent>
                </Card>
                <Card 
                  className={`cursor-pointer transition-all ${bulkListingType === 'auction' ? 'ring-2 ring-primary bg-primary/5' : 'hover:shadow-md'}`}
                  onClick={() => setBulkListingType('auction')}
                >
                  <CardContent className="p-4 text-center">
                    <Zap className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                    <h4 className="font-medium">Auction</h4>
                    <p className="text-sm text-muted-foreground">Let buyers bid for the highest price</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Pricing Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="bulk-currency">Currency</Label>
                <Select value={bulkCurrency} onValueChange={setBulkCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HBAR">HBAR</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="bulk-royalty">Royalty %</Label>
                <Input
                  id="bulk-royalty"
                  type="number"
                  min="0"
                  max="50"
                  step="0.5"
                  value={bulkRoyalty}
                  onChange={(e) => setBulkRoyalty(parseFloat(e.target.value))}
                  placeholder="7.5"
                />
              </div>
              <div></div>
            </div>

            {bulkListingType === 'fixed' ? (
              <div>
                <Label htmlFor="bulk-price">Fixed Price</Label>
                <Input
                  id="bulk-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={bulkPrice}
                  onChange={(e) => setBulkPrice(e.target.value)}
                  placeholder="10"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="bulk-starting-bid">Starting Bid</Label>
                  <Input
                    id="bulk-starting-bid"
                    type="number"
                    min="0"
                    step="0.01"
                    value={bulkStartingBid}
                    onChange={(e) => setBulkStartingBid(e.target.value)}
                    placeholder="1"
                  />
                </div>
                <div>
                  <Label htmlFor="bulk-reserve">Reserve Price (Optional)</Label>
                  <Input
                    id="bulk-reserve"
                    type="number"
                    min="0"
                    step="0.01"
                    value={bulkReservePrice}
                    onChange={(e) => setBulkReservePrice(e.target.value)}
                    placeholder="5"
                  />
                </div>
                <div>
                  <Label htmlFor="bulk-duration">Duration (Hours)</Label>
                  <Select value={bulkDuration.toString()} onValueChange={(value) => setBulkDuration(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Hour</SelectItem>
                      <SelectItem value="3">3 Hours</SelectItem>
                      <SelectItem value="6">6 Hours</SelectItem>
                      <SelectItem value="12">12 Hours</SelectItem>
                      <SelectItem value="24">1 Day</SelectItem>
                      <SelectItem value="72">3 Days</SelectItem>
                      <SelectItem value="168">7 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <Button onClick={applyBulkPricing} className="w-full">
              <Copy className="w-4 h-4 mr-2" />
              Apply {bulkListingType === 'fixed' ? 'Fixed Price' : 'Auction'} Settings to All Videos
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Individual Video Pricing */}
      <div className="space-y-4">
        {videos.map((video, index) => {
          const videoPricing = pricing.find(p => p.videoId === video.id);
          if (!videoPricing) return null;

          return (
            <Card key={video.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="relative flex-shrink-0">
                    <img 
                      src={video.thumbnails.medium.url}
                      alt={video.title}
                      className="w-32 h-20 object-cover rounded-lg border border-gray-100"
                    />
                    <div className="absolute bottom-1 right-1 bg-black/90 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                      {formatDuration(video.duration)}
                    </div>
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1 line-clamp-1">
                        {video.title}
                      </h4>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {formatNumber(video.viewCount)} views
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(video.publishedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Listing Type Toggle */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          variant={videoPricing.listingType === 'fixed' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateVideoPricing(video.id, 'listingType', 'fixed')}
                          className="h-8"
                        >
                          <DollarSign className="w-3 h-3 mr-1" />
                          Fixed Price
                        </Button>
                        <Button
                          variant={videoPricing.listingType === 'auction' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => updateVideoPricing(video.id, 'listingType', 'auction')}
                          className="h-8"
                        >
                          <Zap className="w-3 h-3 mr-1" />
                          Auction
                        </Button>
                      </div>

                      {/* Pricing Fields */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <div>
                          <Label htmlFor={`currency-${video.id}`} className="text-xs">Currency</Label>
                          <Select 
                            value={videoPricing.currency} 
                            onValueChange={(value) => updateVideoPricing(video.id, 'currency', value)}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="HBAR">HBAR</SelectItem>
                              <SelectItem value="USD">USD</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor={`royalty-${video.id}`} className="text-xs">Royalty %</Label>
                          <Input
                            id={`royalty-${video.id}`}
                            type="number"
                            min="0"
                            max="50"
                            step="0.5"
                            value={videoPricing.royaltyPercentage}
                            onChange={(e) => updateVideoPricing(video.id, 'royaltyPercentage', parseFloat(e.target.value))}
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`dividends-${video.id}`}
                            checked={videoPricing.paysDividends}
                            onCheckedChange={(checked) => updateVideoPricing(video.id, 'paysDividends', checked)}
                          />
                          <Label htmlFor={`dividends-${video.id}`} className="text-xs">Dividends</Label>
                        </div>
                      </div>

                      {/* Fixed Price or Auction Fields */}
                      {videoPricing.listingType === 'fixed' ? (
                        <div>
                          <Label htmlFor={`price-${video.id}`} className="text-xs">Fixed Price</Label>
                          <Input
                            id={`price-${video.id}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={videoPricing.price}
                            onChange={(e) => updateVideoPricing(video.id, 'price', e.target.value)}
                            className="h-8 text-sm"
                            placeholder="10"
                          />
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <Label htmlFor={`starting-bid-${video.id}`} className="text-xs">Starting Bid</Label>
                            <Input
                              id={`starting-bid-${video.id}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={videoPricing.startingBid}
                              onChange={(e) => updateVideoPricing(video.id, 'startingBid', e.target.value)}
                              className="h-8 text-sm"
                              placeholder="1"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`reserve-${video.id}`} className="text-xs">Reserve (Optional)</Label>
                            <Input
                              id={`reserve-${video.id}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={videoPricing.reservePrice}
                              onChange={(e) => updateVideoPricing(video.id, 'reservePrice', e.target.value)}
                              className="h-8 text-sm"
                              placeholder="5"
                            />
                          </div>
                          <div>
                            <Label htmlFor={`duration-${video.id}`} className="text-xs">Duration</Label>
                            <Select 
                              value={videoPricing.auctionDuration?.toString() || "24"} 
                              onValueChange={(value) => updateVideoPricing(video.id, 'auctionDuration', parseInt(value))}
                            >
                              <SelectTrigger className="h-8 text-sm">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 Hour</SelectItem>
                                <SelectItem value="3">3 Hours</SelectItem>
                                <SelectItem value="6">6 Hours</SelectItem>
                                <SelectItem value="12">12 Hours</SelectItem>
                                <SelectItem value="24">1 Day</SelectItem>
                                <SelectItem value="72">3 Days</SelectItem>
                                <SelectItem value="168">7 Days</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary and Continue */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Ready to Mint {videos.length} NFTs</h3>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-green-600" />
                  Free minting for all NFTs
                </p>
                <p className="flex items-center gap-2">
                  <Percent className="w-4 h-4 text-green-600" />
                  Royalties on future sales and transfers
                </p>
              </div>
            </div>
            <Button 
              onClick={handleComplete}
              className="bg-green-600 hover:bg-green-700 text-white px-8"
              size="lg"
            >
              Continue to Mint NFTs
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}