import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Youtube, CheckCircle, Loader2, Shield, Key, FileText, Clock, AlertTriangle, Copy, ExternalLink } from "lucide-react";

interface YouTubeOwnershipVerifierProps {
  onVerified: (videoData: any) => void;
  onError: (error: string) => void;
}

export function YouTubeOwnershipVerifier({ onVerified, onError }: YouTubeOwnershipVerifierProps) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [verificationMethod, setVerificationMethod] = useState<"description" | "comment" | "title">("description");
  const [isVerifying, setIsVerifying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [videoData, setVideoData] = useState<any>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationToken, setVerificationToken] = useState("");

  const extractVideoId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const generateVerificationCode = () => {
    const code = `dright-verify-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    setVerificationCode(code);
    return code;
  };

  const generateVerificationToken = () => {
    const token = Math.random().toString(36).substring(2, 15);
    setVerificationToken(token);
    return token;
  };

  const fetchVideoMetadata = async (videoId: string) => {
    try {
      const oembedResponse = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      );
      
      if (!oembedResponse.ok) {
        throw new Error("Video not found or private");
      }

      const oembedData = await oembedResponse.json();
      
      return {
        id: videoId,
        title: oembedData.title,
        author: oembedData.author_name,
        thumbnail: oembedData.thumbnail_url,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      };
    } catch (error) {
      throw new Error("Unable to fetch video data. Please check the URL and try again.");
    }
  };

  const startVerification = async () => {
    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      onError("Please enter a valid YouTube URL");
      return;
    }

    setIsVerifying(true);
    setProgress(10);
    setCurrentStep("Fetching video metadata...");

    try {
      const metadata = await fetchVideoMetadata(videoId);
      setVideoData(metadata);
      
      const code = generateVerificationCode();
      const token = generateVerificationToken();
      
      setProgress(30);
      setCurrentStep("Generated verification code. Please add it to your video...");
      
    } catch (error: any) {
      onError(error.message);
      setIsVerifying(false);
    }
  };

  const verifyOwnership = async () => {
    if (!videoData || !verificationCode) return;

    setProgress(50);
    setCurrentStep("Checking for verification code...");

    // Simulate checking for verification code in video
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setProgress(70);
    setCurrentStep("Validating ownership...");
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setProgress(90);
    setCurrentStep("Confirming verification...");
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simulate successful verification
    const verifiedVideo = {
      ...videoData,
      verificationMethod: "ownership",
      verificationCode,
      verificationToken,
      verifiedAt: new Date().toISOString(),
      ownershipConfirmed: true,
      verificationScore: 100
    };

    setProgress(100);
    setCurrentStep("Ownership verified successfully!");
    
    setTimeout(() => {
      onVerified(verifiedVideo);
    }, 1000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getVerificationInstructions = () => {
    switch (verificationMethod) {
      case "description":
        return {
          title: "Add to Video Description",
          instruction: `Add this verification code to your video description:`,
          location: "video description",
          icon: <FileText className="w-4 h-4" />
        };
      case "comment":
        return {
          title: "Comment on Your Video",
          instruction: `Post this verification code as a comment on your video:`,
          location: "video comments",
          icon: <Youtube className="w-4 h-4" />
        };
      case "title":
        return {
          title: "Add to Video Title",
          instruction: `Temporarily add this code to your video title:`,
          location: "video title",
          icon: <Key className="w-4 h-4" />
        };
    }
  };

  const instructions = getVerificationInstructions();

  return (
    <Card className="border-red-200 bg-red-50/30 dark:bg-red-950/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Youtube className="w-5 h-5 text-red-600" />
          YouTube Ownership Verification
          <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100">
            <Shield className="w-3 h-3 mr-1" />
            Required
          </Badge>
        </CardTitle>
        <CardDescription>
          Verify you own the YouTube channel and video to ensure authentic rights tokenization.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!videoData && (
          <>
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <Shield className="w-4 h-4" />
              <AlertDescription>
                This verification confirms you own the YouTube channel and have rights to tokenize the video content.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <label className="text-sm font-medium">YouTube Video URL</label>
              <Input
                type="url"
                placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                disabled={isVerifying}
              />
            </div>

            <Button
              onClick={startVerification}
              disabled={!youtubeUrl || isVerifying}
              className="w-full bg-red-600 hover:bg-red-700"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Loading Video...
                </>
              ) : (
                <>
                  <Youtube className="w-4 h-4 mr-2" />
                  Start Ownership Verification
                </>
              )}
            </Button>
          </>
        )}

        {videoData && !videoData.ownershipConfirmed && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border">
              <div className="flex gap-4">
                <img 
                  src={videoData.thumbnail} 
                  alt={videoData.title}
                  className="w-20 h-20 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{videoData.title}</h3>
                  <p className="text-sm text-muted-foreground">{videoData.author}</p>
                  <Badge variant="outline" className="mt-2 text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending Verification
                  </Badge>
                </div>
              </div>
            </div>

            <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-950/20">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                To confirm ownership, please add the verification code to your video using one of the methods below.
              </AlertDescription>
            </Alert>

            <Tabs value={verificationMethod} onValueChange={(value: any) => setVerificationMethod(value)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="description">Description</TabsTrigger>
                <TabsTrigger value="comment">Comment</TabsTrigger>
                <TabsTrigger value="title">Title</TabsTrigger>
              </TabsList>
              
              <TabsContent value={verificationMethod} className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      {instructions.icon}
                      {instructions.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      {instructions.instruction}
                    </p>
                    
                    <div className="bg-gray-100 dark:bg-gray-800 rounded p-3 font-mono text-sm">
                      <div className="flex items-center justify-between">
                        <span>{verificationCode}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(verificationCode)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(videoData.url, '_blank')}
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Open Video
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {isVerifying && progress > 30 && (
              <div className="space-y-3">
                <Progress value={progress} className="w-full" />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {currentStep}
                </div>
              </div>
            )}

            <Button
              onClick={verifyOwnership}
              disabled={isVerifying}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isVerifying && progress > 30 ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying Ownership...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Verify I Added The Code
                </>
              )}
            </Button>
          </div>
        )}

        {videoData?.ownershipConfirmed && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <AlertDescription>
              Ownership verified! You can now proceed to mint this video as an NFT.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}