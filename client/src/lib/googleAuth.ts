// Google OAuth and YouTube API integration for video ownership verification

export interface GoogleAuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  refresh_token?: string;
}

export interface YouTubeChannel {
  id: string;
  title: string;
  customUrl?: string;
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
  };
  statistics: {
    subscriberCount: string;
    videoCount: string;
    viewCount: string;
  };
}

export interface YouTubeVideo {
  id: string;
  title: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  thumbnails: {
    default: { url: string };
    medium: { url: string };
    high: { url: string };
  };
}

export interface VerificationResult {
  isOwner: boolean;
  channel?: YouTubeChannel;
  video?: YouTubeVideo;
  error?: string;
}

// Note: Client-side environment variables need VITE_ prefix
// The actual API calls will use server-side credentials for security

// OAuth 2.0 scopes for YouTube channel access
const SCOPES = [
  'https://www.googleapis.com/auth/youtube.readonly',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/userinfo.email'
].join(' ');

/**
 * Initiates Google OAuth flow for YouTube channel verification
 */
export async function initiateGoogleAuth(): Promise<void> {
  // Get Google Client ID from server endpoint for security
  const clientIdResponse = await fetch('/api/auth/google/client-id');
  const { clientId } = await clientIdResponse.json();

  if (!clientId) {
    throw new Error('Google Client ID not available');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${window.location.origin}/auth/google/callback`,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state: 'youtube_verification'
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  
  // Open popup window for OAuth
  const popup = window.open(
    authUrl,
    'googleAuth',
    'width=500,height=600,scrollbars=yes,resizable=yes'
  );

  if (!popup) {
    throw new Error('Popup blocked. Please allow popups for this site.');
  }

  return new Promise((resolve, reject) => {
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        reject(new Error('Authentication cancelled'));
      }
    }, 1000);

    // Listen for messages from popup
    const messageHandler = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        clearInterval(checkClosed);
        popup.close();
        window.removeEventListener('message', messageHandler);
        resolve();
      } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
        clearInterval(checkClosed);
        popup.close();
        window.removeEventListener('message', messageHandler);
        reject(new Error(event.data.error));
      }
    };

    window.addEventListener('message', messageHandler);
  });
}

/**
 * Exchanges authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<GoogleAuthResponse> {
  const response = await fetch('/api/auth/google/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange code for token');
  }

  return response.json();
}

/**
 * Gets user's YouTube channels
 */
export async function getUserYouTubeChannels(accessToken: string): Promise<YouTubeChannel[]> {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true&access_token=${accessToken}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch YouTube channels');
  }

  const data = await response.json();
  
  return data.items.map((item: any) => ({
    id: item.id,
    title: item.snippet.title,
    customUrl: item.snippet.customUrl,
    thumbnails: item.snippet.thumbnails,
    statistics: item.statistics
  }));
}

/**
 * Gets video details from YouTube API via server endpoint
 */
export async function getYouTubeVideoDetails(videoId: string): Promise<YouTubeVideo> {
  console.log('Fetching video details for:', videoId);
  
  const response = await fetch(`/api/youtube/video/${videoId}`);
  
  console.log('Response status:', response.status);
  console.log('Response headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorText = await response.text();
    console.error('API Error Response:', errorText);
    throw new Error(`Failed to fetch video details: ${response.status}`);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType?.includes('application/json')) {
    const htmlContent = await response.text();
    console.error('Received HTML instead of JSON:', htmlContent.substring(0, 200));
    throw new Error('Server returned HTML instead of JSON - API routing issue');
  }

  const video = await response.json();
  console.log('Video details received:', video);
  return video;
}

/**
 * Verifies if user owns the YouTube video
 */
export async function verifyYouTubeVideoOwnership(
  videoId: string,
  accessToken: string
): Promise<VerificationResult> {
  try {
    // Get video details
    const video = await getYouTubeVideoDetails(videoId);
    
    // Get user's channels
    const channels = await getUserYouTubeChannels(accessToken);
    
    // Check if any of user's channels owns the video
    const ownerChannel = channels.find(channel => channel.id === video.channelId);
    
    return {
      isOwner: !!ownerChannel,
      channel: ownerChannel,
      video
    };
  } catch (error) {
    return {
      isOwner: false,
      error: error instanceof Error ? error.message : 'Verification failed'
    };
  }
}

/**
 * Extracts YouTube video ID from various URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Stores verification result for later use
 */
export function storeVerificationResult(result: VerificationResult): void {
  localStorage.setItem('youtube_verification_result', JSON.stringify(result));
}

/**
 * Retrieves stored verification result
 */
export function getStoredVerificationResult(): VerificationResult | null {
  const stored = localStorage.getItem('youtube_verification_result');
  return stored ? JSON.parse(stored) : null;
}

/**
 * Clears stored verification result
 */
export function clearVerificationResult(): void {
  localStorage.removeItem('youtube_verification_result');
}