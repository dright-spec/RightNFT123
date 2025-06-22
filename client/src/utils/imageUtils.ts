// Beautiful default images for different right types
export const getDefaultImageForType = (type: string): string => {
  const baseParams = "?w=600&h=400&fit=crop&auto=format&q=80";
  
  switch (type) {
    case "copyright":
      return `https://images.unsplash.com/photo-1571330735066-03aaa9429d89${baseParams}`; // Professional studio music
    case "royalty":
      return `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f${baseParams}`; // Beautiful music waves
    case "access":
      return `https://images.unsplash.com/photo-1550745165-9bc0b252726f${baseParams}`; // Gaming/tech access
    case "ownership":
      return `https://images.unsplash.com/photo-1634986666676-ec8fd927c23d${baseParams}`; // Digital art/NFT
    case "license":
      return `https://images.unsplash.com/photo-1620712943543-bcc4688e7485${baseParams}`; // Tech/AI patent
    default:
      return `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe${baseParams}`; // Abstract digital
  }
};

// Fallback image if user doesn't provide one
export const getPlaceholderImage = (title?: string): string => {
  const baseParams = "?w=600&h=400&fit=crop&auto=format&q=80";
  
  // Use a beautiful abstract pattern as fallback
  return `https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe${baseParams}`;
};

// Enhanced image with overlay for better text readability
export const getImageWithOverlay = (imageUrl: string): string => {
  if (!imageUrl) return getPlaceholderImage();
  
  // Add overlay parameters for better text contrast
  return imageUrl.includes('unsplash.com') 
    ? `${imageUrl}&overlay=000000&overlay-opacity=20`
    : imageUrl;
};