import { useState } from "react";
import { Play, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface YouTubeEmbedProps {
  videoId: string;
  title?: string;
  className?: string;
  showControls?: boolean;
  autoplay?: boolean;
}

export function YouTubeEmbed({ 
  videoId, 
  title = "YouTube Video", 
  className = "",
  showControls = true,
  autoplay = false 
}: YouTubeEmbedProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const embedUrl = `https://www.youtube.com/embed/${videoId}?${new URLSearchParams({
    modestbranding: '1',
    rel: '0',
    showinfo: '0',
    controls: showControls ? '1' : '0',
    autoplay: autoplay ? '1' : '0',
    origin: window.location.origin
  }).toString()}`;

  const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;

  if (hasError) {
    return (
      <div className={`relative bg-gray-100 rounded-lg overflow-hidden ${className}`}>
        <div className="aspect-video flex items-center justify-center">
          <div className="text-center p-4">
            <div className="text-gray-500 mb-2">Video unavailable</div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(youtubeUrl, '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Watch on YouTube
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative bg-black rounded-lg overflow-hidden shadow-lg ${className}`}>
      {!isLoaded && (
        <div 
          className="absolute inset-0 bg-cover bg-center cursor-pointer"
          style={{ backgroundImage: `url(${thumbnailUrl})` }}
          onClick={() => setIsLoaded(true)}
        >
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="bg-red-600 rounded-full p-4 hover:bg-red-700 transition-colors">
              <Play className="w-8 h-8 text-white fill-current" />
            </div>
          </div>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="bg-black bg-opacity-60 text-white p-2 rounded text-sm">
              Click to play: {title}
            </div>
          </div>
        </div>
      )}
      
      {isLoaded && (
        <iframe
          src={embedUrl}
          title={title}
          className="w-full aspect-video"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onError={() => setHasError(true)}
        />
      )}
      
      {/* YouTube branding */}
      <div className="absolute top-2 right-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(youtubeUrl, '_blank')}
          className="bg-black bg-opacity-60 hover:bg-opacity-80 text-white text-xs h-6 px-2"
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          YouTube
        </Button>
      </div>
    </div>
  );
}