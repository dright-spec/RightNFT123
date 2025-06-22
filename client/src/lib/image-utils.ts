// High-quality default images for NFT rights
export const DEFAULT_NFT_IMAGES = {
  // Content type specific images
  youtube_video: {
    copyright: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=600&fit=crop&auto=format&q=80",
    royalty: "https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=800&h=600&fit=crop&auto=format&q=80",
    license: "https://images.unsplash.com/photo-1574169208507-84376144848b?w=800&h=600&fit=crop&auto=format&q=80",
    access: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&auto=format&q=80"
  },
  
  music_track: {
    copyright: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop&auto=format&q=80",
    royalty: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&h=600&fit=crop&auto=format&q=80",
    license: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=800&h=600&fit=crop&auto=format&q=80",
    access: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop&auto=format&q=80"
  },
  
  patent: {
    copyright: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&auto=format&q=80",
    royalty: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&h=600&fit=crop&auto=format&q=80",
    license: "https://images.unsplash.com/photo-1554774853-719586f82d77?w=800&h=600&fit=crop&auto=format&q=80",
    ownership: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop&auto=format&q=80"
  },
  
  real_estate: {
    ownership: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop&auto=format&q=80",
    royalty: "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&h=600&fit=crop&auto=format&q=80",
    access: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=600&fit=crop&auto=format&q=80",
    license: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=600&fit=crop&auto=format&q=80"
  },
  
  artwork: {
    copyright: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=600&fit=crop&auto=format&q=80",
    royalty: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&auto=format&q=80",
    license: "https://images.unsplash.com/photo-1549887534-1541e9326642?w=800&h=600&fit=crop&auto=format&q=80",
    access: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop&auto=format&q=80"
  },
  
  software: {
    copyright: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=600&fit=crop&auto=format&q=80",
    royalty: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=600&fit=crop&auto=format&q=80",
    license: "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=800&h=600&fit=crop&auto=format&q=80",
    access: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&h=600&fit=crop&auto=format&q=80"
  },
  
  brand: {
    copyright: "https://images.unsplash.com/photo-1553835973-dec43bfddbeb?w=800&h=600&fit=crop&auto=format&q=80",
    royalty: "https://images.unsplash.com/photo-1553835973-dec43bfddbeb?w=800&h=600&fit=crop&auto=format&q=80",
    license: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=800&h=600&fit=crop&auto=format&q=80",
    ownership: "https://images.unsplash.com/photo-1553835973-dec43bfddbeb?w=800&h=600&fit=crop&auto=format&q=80"
  },
  
  book: {
    copyright: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop&auto=format&q=80",
    royalty: "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800&h=600&fit=crop&auto=format&q=80",
    license: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800&h=600&fit=crop&auto=format&q=80",
    access: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop&auto=format&q=80"
  },
  
  other: {
    copyright: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&auto=format&q=80",
    royalty: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&h=600&fit=crop&auto=format&q=80",
    license: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop&auto=format&q=80",
    ownership: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop&auto=format&q=80",
    access: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&auto=format&q=80"
  }
};

// Fallback images by right type only
export const FALLBACK_IMAGES_BY_TYPE = {
  copyright: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&auto=format&q=80",
  royalty: "https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=800&h=600&fit=crop&auto=format&q=80",
  license: "https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop&auto=format&q=80",
  ownership: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop&auto=format&q=80",
  access: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&auto=format&q=80"
};

// Universal fallback
export const UNIVERSAL_FALLBACK = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&auto=format&q=80";

/**
 * Get the best default image for a right based on content source and type
 */
export function getDefaultNFTImage(contentSource?: string, rightType?: string): string {
  // First try to get content-source specific image
  if (contentSource && rightType) {
    const contentImages = DEFAULT_NFT_IMAGES[contentSource as keyof typeof DEFAULT_NFT_IMAGES];
    if (contentImages && contentImages[rightType as keyof typeof contentImages]) {
      return contentImages[rightType as keyof typeof contentImages];
    }
  }
  
  // Fall back to right type specific image
  if (rightType && FALLBACK_IMAGES_BY_TYPE[rightType as keyof typeof FALLBACK_IMAGES_BY_TYPE]) {
    return FALLBACK_IMAGES_BY_TYPE[rightType as keyof typeof FALLBACK_IMAGES_BY_TYPE];
  }
  
  // Universal fallback
  return UNIVERSAL_FALLBACK;
}

/**
 * Generate a placeholder image URL with custom text and colors
 */
export function generatePlaceholderImage(
  text: string, 
  width: number = 800, 
  height: number = 600,
  bgColor: string = "6366f1",
  textColor: string = "ffffff"
): string {
  return `https://via.placeholder.com/${width}x${height}/${bgColor}/${textColor}?text=${encodeURIComponent(text)}`;
}

/**
 * Check if an image URL is valid and accessible
 */
export async function isImageValid(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok && response.headers.get('content-type')?.startsWith('image/');
  } catch {
    return false;
  }
}

/**
 * Get a safe image URL with fallback handling
 */
export async function getSafeImageUrl(
  primaryUrl?: string, 
  contentSource?: string, 
  rightType?: string
): Promise<string> {
  // If primary URL is provided, test it first
  if (primaryUrl) {
    try {
      const isValid = await isImageValid(primaryUrl);
      if (isValid) return primaryUrl;
    } catch {
      // Continue to fallback
    }
  }
  
  // Return appropriate fallback
  return getDefaultNFTImage(contentSource, rightType);
}

/**
 * Optimize image URL for different display contexts
 */
export function optimizeImageUrl(
  url: string, 
  context: 'card' | 'hero' | 'thumbnail' | 'full' = 'card'
): string {
  // If it's already an Unsplash URL, modify the parameters
  if (url.includes('unsplash.com')) {
    const baseUrl = url.split('?')[0];
    
    switch (context) {
      case 'thumbnail':
        return `${baseUrl}?w=200&h=150&fit=crop&auto=format&q=75`;
      case 'card':
        return `${baseUrl}?w=400&h=300&fit=crop&auto=format&q=80`;
      case 'hero':
        return `${baseUrl}?w=1200&h=600&fit=crop&auto=format&q=85`;
      case 'full':
        return `${baseUrl}?w=1600&h=900&fit=crop&auto=format&q=90`;
      default:
        return `${baseUrl}?w=400&h=300&fit=crop&auto=format&q=80`;
    }
  }
  
  // Return original URL if not Unsplash
  return url;
}

/**
 * Extract dominant colors from an image URL (for UI theming)
 */
export function getImageThemeColors(contentSource?: string, rightType?: string): {
  primary: string;
  secondary: string;
  accent: string;
} {
  const colorMap = {
    youtube_video: { primary: '#FF0000', secondary: '#CC0000', accent: '#FF4444' },
    music_track: { primary: '#1DB954', secondary: '#1ED760', accent: '#1AA34A' },
    patent: { primary: '#0066CC', secondary: '#0052A3', accent: '#3385D6' },
    real_estate: { primary: '#8B4513', secondary: '#A0522D', accent: '#CD853F' },
    artwork: { primary: '#800080', secondary: '#9932CC', accent: '#BA55D3' },
    software: { primary: '#0366D6', secondary: '#0256C2', accent: '#2188FF' },
    brand: { primary: '#FF6B35', secondary: '#E55B2B', accent: '#FF8C42' },
    book: { primary: '#8B4513', secondary: '#A0522D', accent: '#CD853F' },
    other: { primary: '#6366F1', secondary: '#4F46E5', accent: '#8B5CF6' }
  };
  
  return colorMap[contentSource as keyof typeof colorMap] || colorMap.other;
}