import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function GoogleCallback() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing authentication...');

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');

        if (error) {
          throw new Error(`OAuth error: ${error}`);
        }

        if (!code) {
          throw new Error('No authorization code received');
        }

        if (state !== 'youtube_verification') {
          throw new Error('Invalid state parameter');
        }

        setMessage('Exchanging authorization code...');

        // Exchange code for access token
        const tokenResponse = await fetch('/api/auth/google/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code })
        });

        if (!tokenResponse.ok) {
          throw new Error('Failed to exchange authorization code');
        }

        const { access_token } = await tokenResponse.json();
        setMessage('Verifying YouTube channel ownership...');

        // Get stored verification state
        const storedState = localStorage.getItem('youtube_verification_state');
        if (!storedState) {
          throw new Error('No verification state found');
        }

        const { videoId, videoDetails } = JSON.parse(storedState);

        // Verify video ownership
        const verifyResponse = await fetch('/api/auth/google/verify-video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            videoId, 
            accessToken: access_token 
          })
        });

        if (!verifyResponse.ok) {
          throw new Error('Failed to verify video ownership');
        }

        const verificationResult = await verifyResponse.json();
        
        // Store verification result
        localStorage.setItem('youtube_verification_result', JSON.stringify({
          isOwner: verificationResult.isOwner,
          video: videoDetails,
          channel: verificationResult.channel,
          timestamp: Date.now()
        }));

        setStatus('success');
        setMessage(verificationResult.isOwner 
          ? 'Video ownership verified successfully!' 
          : 'Video ownership could not be verified'
        );

        // Redirect back to marketplace after 2 seconds
        setTimeout(() => {
          setLocation('/marketplace');
        }, 2000);

      } catch (error) {
        console.error('OAuth callback error:', error);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Authentication failed');
      }
    };

    handleOAuthCallback();
  }, [setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            {status === 'processing' && (
              <>
                <Loader2 className="h-12 w-12 mx-auto animate-spin text-blue-600" />
                <h2 className="text-xl font-semibold">Verifying Ownership</h2>
              </>
            )}
            
            {status === 'success' && (
              <>
                <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
                <h2 className="text-xl font-semibold text-green-700">Verification Complete</h2>
              </>
            )}
            
            {status === 'error' && (
              <>
                <XCircle className="h-12 w-12 mx-auto text-red-600" />
                <h2 className="text-xl font-semibold text-red-700">Verification Failed</h2>
              </>
            )}
            
            <p className="text-muted-foreground">{message}</p>
            
            {status === 'success' && (
              <p className="text-sm text-green-600">
                Redirecting you back to continue creating your right...
              </p>
            )}
            
            {status === 'error' && (
              <Button onClick={() => setLocation('/marketplace')} className="mt-4">
                Return to Marketplace
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}