// Music Platform Search Integration
// This module handles searching across multiple music platforms to find tracks

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
  externalId: string;
}

interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: {
    name: string;
    images: Array<{ url: string; height: number; width: number }>;
    release_date: string;
  };
  duration_ms: number;
  external_urls: { spotify: string };
}

interface YouTubeVideo {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: {
      medium: { url: string };
    };
    publishedAt: string;
  };
}

class MusicPlatformSearchService {
  private spotifyAccessToken: string | null = null;
  private spotifyTokenExpiry: number = 0;

  constructor() {
    // Initialize service
  }

  private async getSpotifyAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.spotifyAccessToken && Date.now() < this.spotifyTokenExpiry) {
      return this.spotifyAccessToken;
    }

    try {
      // Get Client Credentials token for public search
      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${import.meta.env.VITE_SPOTIFY_CLIENT_ID}:${import.meta.env.VITE_SPOTIFY_CLIENT_SECRET}`)}`
        },
        body: 'grant_type=client_credentials'
      });

      if (!response.ok) {
        throw new Error('Failed to get Spotify access token');
      }

      const data = await response.json();
      this.spotifyAccessToken = data.access_token;
      this.spotifyTokenExpiry = Date.now() + (data.expires_in * 1000) - 60000; // 1 minute buffer

      return this.spotifyAccessToken;
    } catch (error) {
      console.error('Spotify token error:', error);
      throw new Error('Unable to access Spotify API. Please ensure API credentials are configured.');
    }
  }

  private async searchSpotify(query: string): Promise<MusicTrack[]> {
    try {
      const token = await this.getSpotifyAccessToken();
      const encodedQuery = encodeURIComponent(query);
      
      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodedQuery}&type=track&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        throw new Error('Spotify search failed');
      }

      const data = await response.json();
      
      return data.tracks.items.map((track: SpotifyTrack): MusicTrack => ({
        id: `spotify_${track.id}`,
        title: track.name,
        artist: track.artists.map(a => a.name).join(', '),
        album: track.album.name,
        imageUrl: track.album.images[1]?.url || track.album.images[0]?.url,
        duration: Math.round(track.duration_ms / 1000),
        releaseDate: track.album.release_date,
        platform: 'spotify',
        url: track.external_urls.spotify,
        externalId: track.id
      }));
    } catch (error) {
      console.error('Spotify search error:', error);
      return [];
    }
  }

  private async searchYouTube(query: string): Promise<MusicTrack[]> {
    try {
      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
      if (!apiKey) {
        throw new Error('YouTube API key not configured');
      }

      const encodedQuery = encodeURIComponent(`${query} official audio music`);
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodedQuery}&type=video&videoCategoryId=10&maxResults=5&key=${apiKey}`
      );

      if (!response.ok) {
        throw new Error('YouTube search failed');
      }

      const data = await response.json();
      
      return data.items.map((video: YouTubeVideo): MusicTrack => ({
        id: `youtube_${video.id.videoId}`,
        title: video.snippet.title,
        artist: video.snippet.channelTitle,
        imageUrl: video.snippet.thumbnails.medium.url,
        releaseDate: video.snippet.publishedAt.split('T')[0],
        platform: 'youtube',
        url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
        externalId: video.id.videoId
      }));
    } catch (error) {
      console.error('YouTube search error:', error);
      return [];
    }
  }

  private parseStreamingUrl(url: string): { platform: string; id: string } | null {
    // Spotify URLs
    const spotifyMatch = url.match(/spotify\.com\/track\/([a-zA-Z0-9]+)/);
    if (spotifyMatch) {
      return { platform: 'spotify', id: spotifyMatch[1] };
    }

    // Apple Music URLs
    const appleMatch = url.match(/music\.apple\.com\/[^\/]+\/album\/[^\/]+\/(\d+)/);
    if (appleMatch) {
      return { platform: 'apple', id: appleMatch[1] };
    }

    // YouTube URLs
    const youtubeMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (youtubeMatch) {
      return { platform: 'youtube', id: youtubeMatch[1] };
    }

    return null;
  }

  public async searchMusicPlatforms(query: string): Promise<MusicTrack[]> {
    const results: MusicTrack[] = [];

    // Check if query is a streaming URL
    const urlParse = this.parseStreamingUrl(query);
    if (urlParse) {
      // If it's a URL, search for the specific track on other platforms
      try {
        if (urlParse.platform === 'spotify') {
          const token = await this.getSpotifyAccessToken();
          const response = await fetch(
            `https://api.spotify.com/v1/tracks/${urlParse.id}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          
          if (response.ok) {
            const track = await response.json();
            const searchQuery = `${track.name} ${track.artists[0].name}`;
            
            // Search other platforms with the track info
            const [spotifyResults, youtubeResults] = await Promise.all([
              this.searchSpotify(searchQuery),
              this.searchYouTube(searchQuery)
            ]);
            
            results.push(...spotifyResults, ...youtubeResults);
          }
        }
      } catch (error) {
        console.error('URL-based search error:', error);
      }
    } else {
      // Regular text search across platforms
      const [spotifyResults, youtubeResults] = await Promise.all([
        this.searchSpotify(query),
        this.searchYouTube(query)
      ]);
      
      results.push(...spotifyResults, ...youtubeResults);
    }

    // Remove duplicates based on title and artist similarity
    const uniqueResults = this.deduplicateResults(results);
    
    return uniqueResults.slice(0, 10); // Limit to 10 results
  }

  private deduplicateResults(tracks: MusicTrack[]): MusicTrack[] {
    const seen = new Set<string>();
    return tracks.filter(track => {
      const key = `${track.title.toLowerCase()}_${track.artist.toLowerCase()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  public async getTrackDetailsById(platform: string, id: string): Promise<MusicTrack | null> {
    try {
      if (platform === 'spotify') {
        const token = await this.getSpotifyAccessToken();
        const response = await fetch(
          `https://api.spotify.com/v1/tracks/${id}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        if (response.ok) {
          const track = await response.json();
          return {
            id: `spotify_${track.id}`,
            title: track.name,
            artist: track.artists.map((a: any) => a.name).join(', '),
            album: track.album.name,
            imageUrl: track.album.images[1]?.url || track.album.images[0]?.url,
            duration: Math.round(track.duration_ms / 1000),
            releaseDate: track.album.release_date,
            platform: 'spotify',
            url: track.external_urls.spotify,
            externalId: track.id
          };
        }
      }
    } catch (error) {
      console.error('Track details error:', error);
    }
    
    return null;
  }
}

export const musicPlatformSearch = new MusicPlatformSearchService();
export type { MusicTrack };