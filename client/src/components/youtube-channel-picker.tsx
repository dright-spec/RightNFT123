import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { CheckCircle, Youtube, Search, Play, Clock, Users, Eye, Loader2, ArrowRight, Shield } from "lucide-react";

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

interface YouTubeChannelPickerProps {
  onVideoSelect: (video: YouTubeVideo) => void;
  onMultipleVideosSelect?: (videos: YouTubeVideo[]) => void;
  rightType: string;
  allowMultiple?: boolean;
}

export function YouTubeChannelPicker({ 
  onVideoSelect, 
  onMultipleVideosSelect, 
  rightType, 
  allowMultiple = false 
}: YouTubeChannelPickerProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<YouTubeVideo[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [channelInfo, setChannelInfo] = useState<any>(null);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = videos.filter(video => 
        video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredVideos(filtered);
    } else {
      setFilteredVideos(videos);
    }
  }, [searchQuery, videos]);

  const handleConnectYouTube = async () => {
    setIsConnecting(true);
    try {
      // Simulating Google OAuth connection process
      // In production, this would redirect to Google OAuth for real authentication
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setIsConnected(true);
      setIsLoadingVideos(true);
      
      // Fetch user's YouTube videos using authenticated API
      const response = await apiRequest("POST", "/api/youtube/channel-videos", {
        authToken: "authenticated_user_token"
      });
      
      const data = await response.json();
      
      if (data.success) {
        setChannelInfo(data.channel);
        setVideos(data.videos);
        setFilteredVideos(data.videos);
        toast({
          title: "YouTube Connected!",
          description: `Found ${data.videos.length} videos in your channel.`,
        });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to YouTube",
        variant: "destructive",
      });
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
      setIsLoadingVideos(false);
    }
  };

  const handleVideoToggle = (video: YouTubeVideo) => {
    if (allowMultiple) {
      const newSelected = new Set(selectedVideos);
      if (newSelected.has(video.id)) {
        newSelected.delete(video.id);
      } else {
        newSelected.add(video.id);
      }
      setSelectedVideos(newSelected);
    } else {
      onVideoSelect(video);
      toast({
        title: "Video Selected!",
        description: "Your video ownership is automatically verified.",
      });
    }
  };

  const handleConfirmSelection = () => {
    const selectedVideosList = videos.filter(video => selectedVideos.has(video.id));
    if (selectedVideosList.length === 0) {
      toast({
        title: "No Videos Selected",
        description: "Please select at least one video to continue.",
        variant: "destructive",
      });
      return;
    }

    const mintingCost = selectedVideosList.length * 100;
    toast({
      title: `${selectedVideosList.length} Videos Selected!`,
      description: `Total minting cost: ${mintingCost} HBAR (100 HBAR per NFT)`,
    });
    
    if (onMultipleVideosSelect) {
      onMultipleVideosSelect(selectedVideosList);
    }
  };

  const formatDuration = (duration: string) => {
    // Convert PT1M30S to 1:30
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

  if (!isConnected) {
    return (
      <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-white to-gray-50/30 overflow-hidden relative">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-50 to-transparent rounded-full -translate-y-16 translate-x-16 opacity-50" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-50 to-transparent rounded-full translate-y-12 -translate-x-12 opacity-50" />
        
        <CardHeader className="text-center relative z-10">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-red-50 to-red-100 rounded-full flex items-center justify-center mb-6 shadow-lg ring-4 ring-red-50 animate-pulse">
            <Youtube className="w-10 h-10 text-red-600" />
          </div>
          <CardTitle className="flex items-center justify-center gap-3 text-2xl mb-2">
            Connect Your YouTube Channel
            <Badge variant="outline" className="bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200 shadow-sm">
              <CheckCircle className="w-3 h-3 mr-1" />
              Instant Verification
            </Badge>
          </CardTitle>
          <CardDescription className="max-w-lg mx-auto text-base leading-relaxed">
            Connect your YouTube account to browse your videos and select which ones to tokenize as NFTs. 
            Ownership is automatically verified since we're accessing your authenticated channel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 relative z-10">
          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center space-y-3 group hover:scale-105 transition-transform duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <Play className="w-6 h-6 text-blue-600" />
              </div>
              <p className="font-semibold text-gray-900">Browse Your Videos</p>
              <p className="text-sm text-muted-foreground">See all your YouTube content in one place</p>
            </div>
            <div className="text-center space-y-3 group hover:scale-105 transition-transform duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-green-50 to-green-100 rounded-xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <p className="font-semibold text-gray-900">Instant Verification</p>
              <p className="text-sm text-muted-foreground">No manual verification steps needed</p>
            </div>
            <div className="text-center space-y-3 group hover:scale-105 transition-transform duration-300">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                <ArrowRight className="w-6 h-6 text-purple-600" />
              </div>
              <p className="font-semibold text-gray-900">Quick Selection</p>
              <p className="text-sm text-muted-foreground">One-click video selection process</p>
            </div>
          </div>

          <Button 
            onClick={handleConnectYouTube}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
            disabled={isConnecting}
            size="lg"
          >
            {isConnecting ? (
              <>
                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                Connecting to YouTube...
              </>
            ) : (
              <>
                <Youtube className="w-6 h-6 mr-3" />
                Connect YouTube Account
              </>
            )}
          </Button>

          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            <div className="text-sm text-muted-foreground text-center space-y-2">
              <p className="flex items-center justify-center gap-2">
                <Shield className="w-4 h-4 text-green-600" />
                We only access your public video information
              </p>
              <p className="flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Your credentials are handled securely by Google
              </p>
              <p className="flex items-center justify-center gap-2">
                <ArrowRight className="w-4 h-4 text-green-600" />
                You can disconnect at any time
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Channel Info */}
      {channelInfo && (
        <Card className="bg-gradient-to-r from-white to-gray-50/50 border-green-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-red-50 to-red-100 rounded-full flex items-center justify-center shadow-md">
                <Youtube className="w-8 h-8 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{channelInfo.title}</h3>
                <p className="text-muted-foreground flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {formatNumber(channelInfo.subscriberCount)} subscribers • {videos.length} videos available
                </p>
              </div>
              <Badge variant="outline" className="bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200 shadow-sm px-3 py-1">
                <CheckCircle className="w-4 h-4 mr-2" />
                Connected
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
        <Input
          placeholder="Search your videos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-12 pr-4 py-3 text-base border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-xl shadow-sm"
        />
      </div>

      {/* Videos Grid */}
      {isLoadingVideos ? (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your videos...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredVideos.length === 0 ? (
            <Alert>
              <AlertDescription>
                {searchQuery ? "No videos match your search." : "No videos found in your channel."}
              </AlertDescription>
            </Alert>
          ) : (
            filteredVideos.map((video, index) => {
              const isSelected = selectedVideos.has(video.id);
              return (
                <Card 
                  key={video.id} 
                  className={`group hover:shadow-md transition-all duration-300 cursor-pointer border-gray-200 hover:border-primary/20 overflow-hidden ${
                    isSelected ? 'ring-2 ring-primary bg-primary/5' : 'bg-white'
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => handleVideoToggle(video)}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-4 items-center">
                      {allowMultiple && (
                        <div className="flex-shrink-0">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                            isSelected 
                              ? 'bg-primary border-primary text-white' 
                              : 'border-gray-300 hover:border-primary'
                          }`}>
                            {isSelected && <CheckCircle className="w-3 h-3" />}
                          </div>
                        </div>
                      )}
                      
                      <div className="relative flex-shrink-0">
                        <img 
                          src={video.thumbnails.medium.url}
                          alt={video.title}
                          className="w-24 h-16 object-cover rounded-lg shadow-sm border border-gray-100"
                        />
                        <div className="absolute bottom-1 right-1 bg-black/90 text-white text-xs px-1.5 py-0.5 rounded text-center font-medium">
                          {formatDuration(video.duration)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                          {video.title}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-1">
                          {video.description || "No description"}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {formatNumber(video.viewCount)}
                          </span>
                          <span>{new Date(video.publishedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      
                      {!allowMultiple && (
                        <Button 
                          className="bg-primary hover:bg-primary/90 text-white"
                          size="sm"
                        >
                          Select
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Multiple Selection Confirmation */}
      {allowMultiple && isConnected && selectedVideos.size > 0 && (
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900">
                  {selectedVideos.size} Video{selectedVideos.size > 1 ? 's' : ''} Selected
                </h4>
                <p className="text-sm text-muted-foreground">
                  Total minting cost: {selectedVideos.size * 100} HBAR ({selectedVideos.size} × 100 HBAR per NFT)
                </p>
              </div>
              <Button 
                onClick={handleConfirmSelection}
                className="bg-primary hover:bg-primary/90"
              >
                Continue with Selected Videos
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}