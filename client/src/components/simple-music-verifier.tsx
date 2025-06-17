import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Upload, 
  CheckCircle, 
  Music, 
  Shield, 
  Camera,
  FileImage,
  ExternalLink,
  Star,
  Zap
} from "lucide-react";

interface MusicVerificationProps {
  onComplete: (verificationData: MusicVerificationData) => void;
  onBack: () => void;
}

interface MusicVerificationData {
  trackTitle: string;
  artistName: string;
  albumName: string;
  releaseDate: string;
  distributor: string;
  verificationMethod: string;
  screenshotData: string;
}

export default function SimpleMusicVerifier({ onComplete, onBack }: MusicVerificationProps) {
  const [step, setStep] = useState<"info" | "verify">("info");
  const [trackInfo, setTrackInfo] = useState({
    trackTitle: "",
    artistName: "",
    albumName: "",
    releaseDate: ""
  });
  const [selectedDistributor, setSelectedDistributor] = useState("");
  const [screenshot, setScreenshot] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const distributors = [
    { id: "distrokid", name: "DistroKid", popular: true },
    { id: "cdbaby", name: "CD Baby", popular: true },
    { id: "tunecore", name: "TuneCore", popular: true },
    { id: "landr", name: "LANDR", popular: false },
    { id: "amuse", name: "Amuse", popular: false },
    { id: "symphonic", name: "Symphonic Distribution", popular: false },
    { id: "other", name: "Other Distributor", popular: false }
  ];

  const handleInfoSubmit = () => {
    if (trackInfo.trackTitle && trackInfo.artistName) {
      setStep("verify");
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setScreenshot(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleComplete = () => {
    onComplete({
      ...trackInfo,
      distributor: selectedDistributor,
      verificationMethod: "distributor_screenshot",
      screenshotData: screenshot
    });
  };

  if (step === "info") {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Music Track Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Star className="w-4 h-4" />
            <AlertDescription>
              First, tell us about your music track. Then we'll verify your ownership through your distributor account.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="trackTitle">Track Title *</Label>
              <Input
                id="trackTitle"
                placeholder="Enter your song title"
                value={trackInfo.trackTitle}
                onChange={(e) => setTrackInfo(prev => ({ ...prev, trackTitle: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="artistName">Artist Name *</Label>
              <Input
                id="artistName"
                placeholder="Your artist/band name"
                value={trackInfo.artistName}
                onChange={(e) => setTrackInfo(prev => ({ ...prev, artistName: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="albumName">Album/Single Name</Label>
              <Input
                id="albumName"
                placeholder="Album or single name"
                value={trackInfo.albumName}
                onChange={(e) => setTrackInfo(prev => ({ ...prev, albumName: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="releaseDate">Release Date</Label>
              <Input
                id="releaseDate"
                type="date"
                value={trackInfo.releaseDate}
                onChange={(e) => setTrackInfo(prev => ({ ...prev, releaseDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button 
              onClick={handleInfoSubmit}
              disabled={!trackInfo.trackTitle || !trackInfo.artistName}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
            >
              Next: Verify Ownership
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Verify Music Ownership
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Zap className="w-4 h-4" />
          <AlertDescription>
            <strong>Simple verification:</strong> Upload a screenshot from your music distributor dashboard showing 
            "{trackInfo.trackTitle}" by {trackInfo.artistName}. This proves you own the distribution rights.
          </AlertDescription>
        </Alert>

        {/* Track Summary */}
        <div className="bg-muted/50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Verifying ownership for:</h4>
          <div className="text-sm space-y-1">
            <p><strong>Track:</strong> {trackInfo.trackTitle}</p>
            <p><strong>Artist:</strong> {trackInfo.artistName}</p>
            {trackInfo.albumName && <p><strong>Album:</strong> {trackInfo.albumName}</p>}
            {trackInfo.releaseDate && <p><strong>Release Date:</strong> {trackInfo.releaseDate}</p>}
          </div>
        </div>

        {/* Step 1: Select Distributor */}
        <div className="space-y-3">
          <Label className="text-base font-medium">1. Which distributor did you use to release this track?</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {distributors.map((distributor) => (
              <Button
                key={distributor.id}
                variant={selectedDistributor === distributor.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDistributor(distributor.id)}
                className="h-auto p-3 justify-start"
              >
                <div className="text-left">
                  <div className="font-medium text-sm">{distributor.name}</div>
                  {distributor.popular && (
                    <Badge variant="secondary" className="text-xs mt-1">Popular</Badge>
                  )}
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Step 2: Upload Screenshot */}
        {selectedDistributor && (
          <div className="space-y-4">
            <Label className="text-base font-medium">2. Upload screenshot from your distributor dashboard</Label>
            
            <Alert>
              <Camera className="w-4 h-4" />
              <AlertDescription>
                Take a screenshot of your {distributors.find(d => d.id === selectedDistributor)?.name} dashboard 
                showing this track's details. Make sure the track title and your name are visible.
              </AlertDescription>
            </Alert>

            <div 
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              {screenshot ? (
                <div className="space-y-4">
                  <img 
                    src={screenshot} 
                    alt="Verification screenshot" 
                    className="max-w-full max-h-48 mx-auto rounded-lg shadow-sm"
                  />
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-sm font-medium">Screenshot uploaded successfully</span>
                  </div>
                  <Button variant="outline" size="sm">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Different Image
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <FileImage className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <h4 className="font-medium">Upload Distributor Screenshot</h4>
                    <p className="text-sm text-muted-foreground">
                      PNG, JPG, or WebP up to 10MB
                    </p>
                  </div>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </div>
        )}

        {/* Quick Help */}
        {selectedDistributor && (
          <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Quick access links:
              </h4>
              <div className="space-y-1 text-sm">
                {selectedDistributor === "distrokid" && (
                  <p>• <a href="https://distrokid.com/hyperfollow" target="_blank" rel="noopener" className="text-blue-600 hover:underline">DistroKid Dashboard</a> → My Music → Find your track</p>
                )}
                {selectedDistributor === "cdbaby" && (
                  <p>• <a href="https://members.cdbaby.com" target="_blank" rel="noopener" className="text-blue-600 hover:underline">CD Baby Member Area</a> → My Releases</p>
                )}
                {selectedDistributor === "tunecore" && (
                  <p>• <a href="https://www.tunecore.com/account" target="_blank" rel="noopener" className="text-blue-600 hover:underline">TuneCore Account</a> → My Music</p>
                )}
                <p className="text-muted-foreground">Make sure the track title "{trackInfo.trackTitle}" is visible in your screenshot</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => setStep("info")}>
            Back to Track Info
          </Button>
          <Button 
            onClick={handleComplete}
            disabled={!selectedDistributor || !screenshot}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Complete Verification
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}