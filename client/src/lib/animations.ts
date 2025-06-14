// Animation utilities for smooth user interaction transitions
// Comprehensive micro-animation system for Dright marketplace

export const animationClasses = {
  // Entry animations
  fadeIn: "animate-fade-in",
  fadeInUp: "animate-fade-in-up",
  fadeInDown: "animate-fade-in-down",
  slideInLeft: "animate-slide-in-left",
  slideInRight: "animate-slide-in-right",
  scaleIn: "animate-scale-in",
  bounceIn: "animate-bounce-in",
  
  // Hover animations
  hoverScale: "transition-transform duration-300 hover:scale-105",
  hoverShadow: "transition-shadow duration-300 hover:shadow-lg",
  hoverTranslate: "transition-transform duration-300 hover:-translate-y-1",
  hoverGlow: "transition-all duration-300 hover:shadow-2xl",
  
  // Interactive animations
  pulseGlow: "animate-pulse-glow",
  shimmer: "animate-shimmer",
  float: "animate-float",
  wiggle: "animate-wiggle",
  
  // State transitions
  smooth: "transition-all duration-300",
  fast: "transition-all duration-200",
  slow: "transition-all duration-500",
  
  // Combined effects
  cardHover: "transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:-translate-y-1",
  buttonHover: "transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95",
  iconHover: "transition-transform duration-200 hover:scale-110",
  gradientHover: "transition-all duration-300 hover:bg-gradient-to-r hover:from-primary/10 hover:to-secondary/10",
};

export const staggerDelays = {
  // For grid items
  grid: (index: number) => ({ animationDelay: `${index * 100}ms` }),
  
  // For list items
  list: (index: number) => ({ animationDelay: `${index * 50}ms` }),
  
  // For step indicators
  steps: (index: number) => ({ animationDelay: `${index * 150}ms` }),
  
  // For activity feed items
  feed: (index: number) => ({ animationDelay: `${index * 75}ms` }),
  
  // For right listings
  rightCard: (index: number) => ({ animationDelay: `${index * 120}ms` }),
  
  // For marketplace grid
  marketplace: (index: number) => ({ animationDelay: `${index * 80}ms` }),
};

export const createStaggeredAnimation = (
  baseClass: string,
  delayMs: number = 100
) => {
  return (index: number) => ({
    className: baseClass,
    style: { animationDelay: `${index * delayMs}ms` }
  });
};

// Utility functions for dynamic animations
export const getRandomFloat = () => `animate-float`;
export const getRandomPulse = () => Math.random() > 0.5 ? "animate-pulse" : "";

// Animation presets for common UI patterns
export const presets = {
  card: `${animationClasses.cardHover} ${animationClasses.fadeInUp}`,
  button: `${animationClasses.buttonHover}`,
  modal: `${animationClasses.scaleIn}`,
  toast: `${animationClasses.slideInRight}`,
  dropdown: `${animationClasses.fadeInDown}`,
  sidebar: `${animationClasses.slideInLeft}`,
  hero: `${animationClasses.fadeIn}`,
  grid: `${animationClasses.fadeInUp}`,
  form: `${animationClasses.smooth}`,
  icon: `${animationClasses.iconHover}`,
  
  // Right listing specific animations
  rightCard: `${animationClasses.fadeInUp} ${animationClasses.cardHover}`,
  rightGrid: `${animationClasses.fadeInUp}`,
  rightDetails: `${animationClasses.fadeIn} ${animationClasses.smooth}`,
  rightImage: `${animationClasses.scaleIn} ${animationClasses.hoverScale}`,
  rightPrice: `${animationClasses.fadeInUp} ${animationClasses.pulseGlow}`,
  rightStatus: `${animationClasses.fadeIn} ${animationClasses.smooth}`,
};

// High-value animation for special elements
export const specialEffects = {
  highValue: "ring-2 ring-yellow-400/50 animate-pulse-glow",
  verified: "ring-2 ring-green-400/50 animate-pulse-glow",
  pending: "ring-2 ring-orange-400/50 animate-pulse",
  error: "ring-2 ring-red-400/50 animate-wiggle",
  success: "ring-2 ring-green-400/50 animate-bounce-in",
  loading: "animate-shimmer",
};

export default {
  animationClasses,
  staggerDelays,
  createStaggeredAnimation,
  presets,
  specialEffects,
};