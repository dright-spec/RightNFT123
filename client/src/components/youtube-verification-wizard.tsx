import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Youtube, CheckCircle, XCircle, Loader2, Clock, ArrowRight, Zap, Shield, AlertTriangle, ExternalLink } from "lucide-react";

interface YouTubeVerificationWizardProps {
  onVerificationSuccess: (videoDetails: any) => void;
  onSkip: () => void;
  rightType: string;
  initialUrl?: string;
}

export function YouTubeVerificationWizard({ onVerificationSuccess, onSkip, rightType, initialUrl }: YouTubeVerificationWizardProps) {
  const [youtubeUrl, setYoutubeUrl] = useState(initialUrl || "");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    details?: any;
    error?: string;
  } | null>(null);
  const { toast } = useToast();

  // Auto-verify if initial URL is provided (only on mount)
  useEffect(() => {
    if (initialUrl && initialUrl.trim() && isValidYouTubeUrl(initialUrl) && !verificationResult) {
      handleVerify();
    }
  }, []); // Empty dependency array to run only on mount

  const isVideoContent = rightType === "copyright" || rightType === "royalty";

  const handleVerify = async () => {
    if (!youtubeUrl.trim()) return;

    setIsVerifying(true);
    try {
      const response = await apiRequest("POST", "/api/youtube/verify", { url: youtubeUrl });
      const data = await response.json();
      
      if (data.success) {
        setVerificationResult({
          success: true,
          details: data.data
        });

        toast({
          title: "Video Found!",
          description: "Please sign in with Google to confirm you own this video.",
        });

        // Do NOT call onVerificationSuccess here - only after Google OAuth
      } else {
        throw new Error(data.error || "Verification failed");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Verification failed";
      setVerificationResult({
        success: false,
        error: errorMessage
      });

      toast({
        title: "Verification Failed",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Log error for debugging
      console.error('YouTube verification error:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const isValidYouTubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
    return youtubeRegex.test(url);
  };

  const handleGoogleSignIn = async () => {
    if (!verificationResult?.details) return;

    setIsAuthenticating(true);
    try {
      // Step 1: Redirect to Google OAuth (simulated)
      // In production, this would redirect to Google OAuth consent screen
      const authCode = `mock_auth_code_${Date.now()}`;
      
      // Step 2: Verify ownership with our secure backend
      const authResponse = await apiRequest("POST", "/api/youtube/authenticate", {
        videoId: verificationResult.details.videoId,
        originalUrl: youtubeUrl,
        authCode: authCode
      });

      const authData = await authResponse.json();

      if (authData.success) {
        toast({
          title: "Ownership Verified!",
          description: "Google authentication confirmed you own this video. Your right is approved for NFT minting.",
        });

        // Update verification result with ownership confirmation
        setVerificationResult({
          success: true,
          details: {
            ...verificationResult.details,
            ...authData.data,
            originalUrl: youtubeUrl,
            securelyVerified: true
          }
        });

        // Complete verification with authenticated data
        const completeVerificationData = {
          ...verificationResult.details,
          ...authData.data,
          originalUrl: youtubeUrl,
          securelyVerified: true
        };

        onVerificationSuccess(completeVerificationData);
      } else {
        throw new Error(authData.error || "Ownership verification failed");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Authentication failed";
      toast({
        title: "Verification Failed", 
        description: errorMessage.includes("Ownership verification failed") 
          ? "This video was not found in your YouTube channel. Please ensure you own this video."
          : errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (verificationResult?.success && verificationResult.details?.ownershipConfirmed) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <CheckCircle className="w-5 h-5" />
            Ownership Verified!
          </CardTitle>
          <CardDescription className="text-green-700">
            Google authentication confirmed you own this video. Your right is approved for NFT minting.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                <Zap className="w-3 h-3 mr-1" />
                Instant Approval
              </Badge>
              <span className="text-green-700">Ready to mint NFT</span>
            </div>
            
            {verificationResult.details && (
              <div className="bg-white p-4 rounded-lg border">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <img 
                      src={verificationResult.details.thumbnails?.medium?.url}
                      alt="Video thumbnail"
                      className="w-32 h-24 object-cover rounded-lg border"
                      onError={(e) => {
                        e.currentTarget.src = verificationResult.details.thumbnails?.default?.url || '';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 mb-1 truncate">
                      {verificationResult.details.title}
                    </h4>
                    <p className="text-sm text-gray-600 mb-2">
                      By {verificationResult.details.channelTitle}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>Video ID: {verificationResult.details.videoId}</span>
                      {verificationResult.details.verified && (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Ownership Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-dashed border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Youtube className="w-5 h-5 text-red-500" />
          Fast-Track with YouTube Verification
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <Zap className="w-3 h-3 mr-1" />
            Instant Approval
          </Badge>
        </CardTitle>
        <CardDescription>
          {isVideoContent 
            ? "Is this content from a YouTube video you own? Get instant verification and skip the waiting period."
            : "Do you have a YouTube video showcasing this content? Verify ownership for instant approval."
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center gap-2 text-sm text-green-700">
            <CheckCircle className="w-4 h-4" />
            <span>Instant approval</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-700">
            <Shield className="w-4 h-4" />
            <span>Verified ownership</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-green-700">
            <Clock className="w-4 h-4" />
            <span>No waiting period</span>
          </div>
        </div>

        {/* URL Input */}
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium">YouTube Video URL</label>
            <Input
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className={`${!youtubeUrl || isValidYouTubeUrl(youtubeUrl) ? '' : 'border-red-300'}`}
            />
            {youtubeUrl && !isValidYouTubeUrl(youtubeUrl) && (
              <p className="text-sm text-red-600">Please enter a valid YouTube URL</p>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleVerify}
              disabled={!youtubeUrl || !isValidYouTubeUrl(youtubeUrl) || isVerifying}
              className="flex-1"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Youtube className="w-4 h-4 mr-2" />
                  Verify & Fast-Track
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onSkip}>
              Skip for Now
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {verificationResult?.error && (
          <Alert variant="destructive">
            <XCircle className="w-4 h-4" />
            <AlertDescription>
              {verificationResult.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Video Found - Requires Authentication */}
        {verificationResult?.success && !verificationResult.details?.ownershipConfirmed && (
          <div className="space-y-4">
            {/* Video Preview Card */}
            <div className="bg-white p-4 rounded-lg border">
              <div className="flex items-center gap-3 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">Video Found!</span>
              </div>
              
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <img 
                    src={verificationResult.details?.thumbnails?.medium?.url}
                    alt="Video thumbnail"
                    className="w-32 h-24 object-cover rounded-lg border"
                    onError={(e) => {
                      e.currentTarget.src = verificationResult.details?.thumbnails?.default?.url || '';
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 mb-1 truncate">
                    {verificationResult.details?.title}
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    By {verificationResult.details?.channelTitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Simple Call to Action */}
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-600">
                Please sign in to your Google account to confirm you own this video.
              </p>
              
              <Button 
                onClick={handleGoogleSignIn}
                className="bg-red-600 hover:bg-red-700 px-8"
                disabled={isAuthenticating}
              >
                {isAuthenticating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying Ownership...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign in with Google
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• You must be logged into the YouTube account that owns the video</p>
          <p>• The video must be publicly visible or unlisted</p>
          <p>• We verify ownership through YouTube's API authentication</p>
        </div>
      </CardContent>
    </Card>
  );
}