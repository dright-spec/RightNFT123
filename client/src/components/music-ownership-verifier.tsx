import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Music, 
  ExternalLink, 
  Shield, 
  CheckCircle, 
  AlertCircle, 
  Upload, 
  Search,
  Spotify,
  Apple,
  Youtube,
  FileAudio,
  Zap,
  Clock
} from "lucide-react";
import { SiSpotify, SiApplemusic, SiYoutube, SiSoundcloud } from "react-icons/si";

interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  album?: string;
  imageUrl?: string;
  duration?: number;
  releaseDate?: string;
  platform: "spotify" | "apple" | "youtube" | "soundcloud";
  url: string;
}

interface MusicOwnershipVerifierProps {
  onVerificationComplete: (track: MusicTrack, verificationMethod: string) => void;
  onCancel: () => void;
}

export default function MusicOwnershipVerifier({ 
  onVerificationComplete, 
  onCancel 
}: MusicOwnershipVerifierProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(null);
  const [verificationMethod, setVerificationMethod] = useState<string>("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<MusicTrack[]>([]);
  const [verificationStep, setVerificationStep] = useState<"search" | "verify" | "confirm">("search");

  // Mock search function - in production, this would integrate with actual APIs
  const searchMusicPlatforms = async (query: string) => {
    setIsSearching(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock results from multiple platforms
    const mockResults: MusicTrack[] = [
      {
        id: "spotify_1",
        title: "Your Song Title",
        artist: "Your Artist Name",
        album: "Album Name",
        platform: "spotify",
        url: "https://open.spotify.com/track/example",
        imageUrl: "https://via.placeholder.com/300x300/1DB954/FFFFFF?text=Spotify",
        duration: 180,
        releaseDate: "2024-01-15"
      },
      {
        id: "apple_1",
        title: "Your Song Title",
        artist: "Your Artist Name",
        album: "Album Name",
        platform: "apple",
        url: "https://music.apple.com/us/album/example",
        imageUrl: "https://via.placeholder.com/300x300/FC3C44/FFFFFF?text=Apple",
        duration: 180,
        releaseDate: "2024-01-15"
      },
      {
        id: "youtube_1",
        title: "Your Song Title - Official Audio",
        artist: "Your Artist Name",
        platform: "youtube",
        url: "https://youtube.com/watch?v=example",
        imageUrl: "https://via.placeholder.com/300x300/FF0000/FFFFFF?text=YouTube",
        duration: 182
      }
    ];
    
    setSearchResults(mockResults);
    setIsSearching(false);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchMusicPlatforms(searchQuery);
    }
  };

  const handleTrackSelection = (track: MusicTrack) => {
    setSelectedTrack(track);
    setVerificationStep("verify");
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case "spotify":
        return <SiSpotify className="w-5 h-5 text-green-500" />;
      case "apple":
        return <SiApplemusic className="w-5 h-5 text-red-500" />;
      case "youtube":
        return <SiYoutube className="w-5 h-5 text-red-600" />;
      case "soundcloud":
        return <SiSoundcloud className="w-5 h-5 text-orange-500" />;
      default:
        return <Music className="w-5 h-5" />;
    }
  };

  const verificationMethods = [
    {
      id: "distributor-dashboard",
      title: "Music Distributor Dashboard",
      description: "Upload screenshot from DistroKid, CD Baby, TuneCore, or similar",
      icon: <Upload className="w-5 h-5" />,
      difficulty: "Easy",
      trustLevel: "High",
      timeEstimate: "2 minutes"
    },
    {
      id: "streaming-analytics",
      title: "Streaming Platform Analytics",
      description: "Show Spotify for Artists or Apple Music for Artists dashboard",
      icon: <Shield className="w-5 h-5" />,
      difficulty: "Easy", 
      trustLevel: "High",
      timeEstimate: "3 minutes"
    },
    {
      id: "copyright-certificate",
      title: "Copyright Registration",
      description: "Upload official copyright certificate or registration",
      icon: <FileAudio className="w-5 h-5" />,
      difficulty: "Medium",
      trustLevel: "Very High",
      timeEstimate: "5 minutes"
    },
    {
      id: "publishing-agreement",
      title: "Publishing/Label Agreement",
      description: "Upload contract or agreement showing ownership rights",
      icon: <ExternalLink className="w-5 h-5" />,
      difficulty: "Medium",
      trustLevel: "High",
      timeEstimate: "7 minutes"
    }
  ];

  return (
    <div className="space-y-6">
      {verificationStep === "search" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="w-5 h-5" />
              Find Your Music
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search for your song (title, artist, or paste streaming URL)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={!searchQuery.trim() || isSearching}>
                {isSearching ? (
                  <Clock className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Search
              </Button>
            </div>

            <Alert>
              <Zap className="w-4 h-4" />
              <AlertDescription>
                We'll search across Spotify, Apple Music, YouTube, and SoundCloud to find your track.
                You can also paste direct links from these platforms.
              </AlertDescription>
            </Alert>

            {searchResults.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Found tracks across platforms:</h4>
                {searchResults.map((track) => (
                  <Card 
                    key={track.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleTrackSelection(track)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {track.imageUrl && (
                          <img 
                            src={track.imageUrl} 
                            alt={track.title}
                            className="w-16 h-16 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getPlatformIcon(track.platform)}
                            <h5 className="font-medium">{track.title}</h5>
                          </div>
                          <p className="text-sm text-muted-foreground">{track.artist}</p>
                          {track.album && (
                            <p className="text-xs text-muted-foreground">{track.album}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="mb-2">
                            {track.platform.charAt(0).toUpperCase() + track.platform.slice(1)}
                          </Badge>
                          {track.duration && (
                            <p className="text-xs text-muted-foreground">
                              {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {verificationStep === "verify" && selectedTrack && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Verify Ownership of "{selectedTrack.title}"
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-4">
                {selectedTrack.imageUrl && (
                  <img 
                    src={selectedTrack.imageUrl} 
                    alt={selectedTrack.title}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div>
                  <h4 className="font-medium">{selectedTrack.title}</h4>
                  <p className="text-sm text-muted-foreground">{selectedTrack.artist}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {getPlatformIcon(selectedTrack.platform)}
                    <Badge variant="outline" className="text-xs">
                      {selectedTrack.platform.charAt(0).toUpperCase() + selectedTrack.platform.slice(1)}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <Alert>
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>
                To tokenize this music as an NFT, you must prove you own the rights to it. 
                Choose the verification method that's easiest for you.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <h4 className="font-medium">Choose verification method:</h4>
              {verificationMethods.map((method) => (
                <Card 
                  key={method.id}
                  className={`cursor-pointer transition-all ${
                    verificationMethod === method.id 
                      ? "ring-2 ring-primary border-primary" 
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setVerificationMethod(method.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        {method.icon}
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium mb-1">{method.title}</h5>
                        <p className="text-sm text-muted-foreground mb-3">{method.description}</p>
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary" className="text-xs">
                            {method.difficulty}
                          </Badge>
                          <Badge 
                            variant={method.trustLevel === "Very High" ? "default" : "outline"}
                            className="text-xs"
                          >
                            {method.trustLevel} Trust
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {method.timeEstimate}
                          </span>
                        </div>
                      </div>
                      {verificationMethod === method.id && (
                        <CheckCircle className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setVerificationStep("search")}>
                Back to Search
              </Button>
              <Button 
                onClick={() => {
                  if (verificationMethod && selectedTrack) {
                    onVerificationComplete(selectedTrack, verificationMethod);
                  }
                }}
                disabled={!verificationMethod}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                Continue Verification
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}