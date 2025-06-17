import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Youtube, CheckCircle, Clock, AlertTriangle } from "lucide-react";

interface ManualYouTubeVerificationProps {
  onVerified: (videoData: any) => void;
  onSkip: () => void;
}

export function ManualYouTubeVerification({ onVerified, onSkip }: ManualYouTubeVerificationProps) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStep, setVerificationStep] = useState<"input" | "pending" | "verified">("input");

  const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleSubmit = async () => {
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      alert("Please enter a valid YouTube URL");
      return;
    }

    setIsVerifying(true);
    setVerificationStep("pending");

    // Simulate verification process
    setTimeout(() => {
      const videoData = {
        id: videoId,
        title: `Video ${videoId}`,
        description: "This video will be verified by admin review",
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        url: youtubeUrl,
        verificationMethod: "manual"
      };

      setVerificationStep("verified");
      setIsVerifying(false);
      onVerified(videoData);
    }, 2000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Youtube className="w-5 h-5 text-red-600" />
          YouTube Video Verification
        </CardTitle>
        <CardDescription>
          Enter your YouTube video URL for manual verification by our admin team.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {verificationStep === "input" && (
          <>
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                Due to authentication setup, we'll verify your video ownership through admin review instead of automatic verification.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <label className="text-sm font-medium">YouTube Video URL</label>
              <Input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleSubmit}
                disabled={!youtubeUrl || isVerifying}
                className="flex items-center gap-2"
              >
                <Youtube className="w-4 h-4" />
                Submit for Verification
              </Button>
              <Button variant="outline" onClick={onSkip}>
                Skip for Now
              </Button>
            </div>
          </>
        )}

        {verificationStep === "pending" && (
          <div className="text-center py-6">
            <Clock className="w-8 h-8 mx-auto mb-3 text-orange-500 animate-spin" />
            <h3 className="font-medium mb-2">Processing Video...</h3>
            <p className="text-sm text-muted-foreground">
              Extracting video information and preparing for admin review
            </p>
          </div>
        )}

        {verificationStep === "verified" && (
          <div className="text-center py-6">
            <CheckCircle className="w-8 h-8 mx-auto mb-3 text-green-500" />
            <h3 className="font-medium mb-2">Video Submitted Successfully</h3>
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">
              Pending Admin Review
            </Badge>
            <p className="text-sm text-muted-foreground mt-2">
              Your video will be reviewed by our team and verified within 24 hours
            </p>
          </div>
        )}

        <Alert>
          <AlertDescription>
            Manual verification ensures video ownership while Firebase authentication is being configured.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}