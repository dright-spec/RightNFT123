import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency values with appropriate suffixes
export function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  } else if (value >= 1) {
    return value.toFixed(0);
  } else {
    return value.toFixed(2);
  }
}

// Legacy function - use getDefaultNFTImage from image-utils instead
export function generateImageUrl(): string {
  return "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop&auto=format&q=80";
}
