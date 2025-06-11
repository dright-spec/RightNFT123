import { useEffect } from "react";
import { useLocation } from "wouter";
import { exchangeCodeForToken } from "@/lib/googleAuth";

export default function GoogleCallback() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');
        const state = urlParams.get('state');

        if (error) {
          // Send error to parent window
          window.opener?.postMessage({
            type: 'GOOGLE_AUTH_ERROR',
            error: error
          }, window.location.origin);
          window.close();
          return;
        }

        if (code && state === 'youtube_verification') {
          // Exchange code for tokens
          const tokenData = await exchangeCodeForToken(code);
          
          // Send success to parent window
          window.opener?.postMessage({
            type: 'GOOGLE_AUTH_SUCCESS',
            tokenData
          }, window.location.origin);
          window.close();
        } else {
          throw new Error('Invalid callback parameters');
        }
      } catch (error) {
        // Send error to parent window
        window.opener?.postMessage({
          type: 'GOOGLE_AUTH_ERROR',
          error: error instanceof Error ? error.message : 'Authentication failed'
        }, window.location.origin);
        window.close();
      }
    };

    handleCallback();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Processing authentication...</p>
      </div>
    </div>
  );
}