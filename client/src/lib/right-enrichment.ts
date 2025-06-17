import { Music, FileText, Palette, Book, Building, Code, Trademark, Coins, Crown, Key, FileVideo, Briefcase } from "lucide-react";
import type { RightWithCreator } from "@shared/schema";

export interface RightEnrichmentData {
  displayIcon: any;
  displayTitle: string;
  contextualDescription: string;
  investmentHighlights: string[];
  riskFactors: string[];
  expectedReturns: string;
  marketContext: string;
  buyerBenefits: string[];
  technicalDetails: string[];
  verificationStatus: "verified" | "pending" | "manual_review";
  verificationBadge: string;
}

// Get enriched display data for a right based on its type and content source
export function enrichRightDisplay(right: RightWithCreator): RightEnrichmentData {
  const contentSource = right.contentSource || "other";
  const rightType = right.type;

  // Base enrichment data
  let enrichment: RightEnrichmentData = {
    displayIcon: FileText,
    displayTitle: right.title,
    contextualDescription: right.description,
    investmentHighlights: [],
    riskFactors: [],
    expectedReturns: "Variable returns based on asset performance",
    marketContext: "Digital rights marketplace",
    buyerBenefits: ["Digital ownership", "Blockchain verified"],
    technicalDetails: [],
    verificationStatus: right.verificationStatus as any || "pending",
    verificationBadge: "Verified"
  };

  // YouTube Video Rights
  if (contentSource === "youtube_video") {
    enrichment.displayIcon = FileVideo;
    enrichment.displayTitle = `${rightType === "copyright" ? "YouTube Video Rights" : "YouTube Revenue Share"} - ${right.title}`;
    enrichment.contextualDescription = `${rightType === "copyright" ? "Full ownership rights" : "Revenue sharing opportunity"} for YouTube video: ${right.title}`;
    enrichment.investmentHighlights = [
      "Auto-verified YouTube ownership",
      "Instant revenue tracking",
      "Global audience reach",
      "Platform-backed monetization"
    ];
    enrichment.riskFactors = [
      "YouTube policy changes",
      "Content may be demonetized",
      "Audience engagement volatility"
    ];
    enrichment.expectedReturns = "Monthly ad revenue + potential sponsorship income";
    enrichment.marketContext = "YouTube content monetization - $28.8B annual revenue";
    enrichment.buyerBenefits = [
      "Monthly revenue distributions",
      "YouTube Analytics access",
      "Content licensing rights",
      "Brand partnership opportunities"
    ];
    enrichment.technicalDetails = [
      "YouTube API verified ownership",
      "Real-time revenue tracking",
      "Automated payment distribution"
    ];
    enrichment.verificationStatus = "verified";
    enrichment.verificationBadge = "YouTube Verified";
  }

  // Music Track Rights
  else if (contentSource === "music_track") {
    enrichment.displayIcon = Music;
    enrichment.displayTitle = rightType === "copyright" ? `Master Recording Rights - ${right.title}` : 
                            rightType === "royalty" ? `Streaming Revenue Share - ${right.title}` :
                            `Music Licensing Rights - ${right.title}`;
    enrichment.contextualDescription = `${rightType === "copyright" ? "Full master recording ownership" : 
                                      rightType === "royalty" ? "Ongoing streaming royalty share" : 
                                      "Commercial licensing rights"} for: ${right.title}`;
    enrichment.investmentHighlights = [
      "Streaming platform revenue",
      "Radio play royalties", 
      "Sync licensing potential",
      "Growing music market"
    ];
    enrichment.riskFactors = [
      "Music industry volatility",
      "Streaming rate changes",
      "Artist popularity fluctuation"
    ];
    enrichment.expectedReturns = rightType === "royalty" ? "Quarterly streaming royalties" : "Licensing fees + royalties";
    enrichment.marketContext = "Global music industry - $26.2B streaming revenue (2022)";
    enrichment.buyerBenefits = [
      "PRO royalty distributions",
      "Sync licensing revenue",
      "Streaming platform payouts",
      "Radio broadcast royalties"
    ];
    enrichment.technicalDetails = [
      "SHA-256 document verification",
      "Manual ownership review",
      "PRO registration tracking"
    ];
    enrichment.verificationStatus = "manual_review";
    enrichment.verificationBadge = "Ownership Verified";
  }

  // Artwork Rights
  else if (contentSource === "artwork") {
    enrichment.displayIcon = Palette;
    enrichment.displayTitle = rightType === "copyright" ? `Art Copyright - ${right.title}` : 
                            rightType === "license" ? `Art Licensing Rights - ${right.title}` :
                            `Artwork Rights - ${right.title}`;
    enrichment.contextualDescription = `${rightType === "copyright" ? "Full copyright ownership" : 
                                      rightType === "license" ? "Commercial usage licensing" : 
                                      "Artistic rights"} for: ${right.title}`;
    enrichment.investmentHighlights = [
      "NFT marketplace potential",
      "Print licensing revenue",
      "Commercial usage rights",
      "Artist reputation growth"
    ];
    enrichment.riskFactors = [
      "Art market volatility",
      "Style trend changes",
      "Copyright infringement risk"
    ];
    enrichment.expectedReturns = rightType === "license" ? "Per-use licensing fees" : "Resale value appreciation";
    enrichment.marketContext = "Digital art market - $2.6B NFT sales (2022)";
    enrichment.buyerBenefits = [
      "Commercial usage rights",
      "Print reproduction rights",
      "Digital display licensing",
      "Resale opportunities"
    ];
    enrichment.technicalDetails = [
      "High-resolution file access",
      "Usage rights documentation",
      "Attribution requirements"
    ];
  }

  // Book/Publishing Rights
  else if (contentSource === "book") {
    enrichment.displayIcon = Book;
    enrichment.displayTitle = rightType === "copyright" ? `Publishing Rights - ${right.title}` : 
                            rightType === "royalty" ? `Book Royalty Share - ${right.title}` :
                            `Publishing License - ${right.title}`;
    enrichment.contextualDescription = `${rightType === "copyright" ? "Full publishing rights" : 
                                      rightType === "royalty" ? "Ongoing royalty share" : 
                                      "Publishing licensing"} for: ${right.title}`;
    enrichment.investmentHighlights = [
      "Multiple format revenue",
      "Translation rights potential",
      "Film adaptation possibilities",
      "Educational market access"
    ];
    enrichment.riskFactors = [
      "Publishing industry changes",
      "Market saturation",
      "Platform dependency"
    ];
    enrichment.expectedReturns = "Quarterly publishing royalties + licensing fees";
    enrichment.marketContext = "Global book market - $143B annual revenue";
    enrichment.buyerBenefits = [
      "Print edition royalties",
      "Digital sales revenue",
      "Translation licensing",
      "Adaptation rights"
    ];
  }

  // Real Estate Ownership
  else if (contentSource === "real_estate" && rightType === "ownership") {
    enrichment.displayIcon = Building;
    enrichment.displayTitle = `Property Ownership Stake - ${right.title}`;
    enrichment.contextualDescription = `Fractional ownership stake in real estate property: ${right.title}`;
    enrichment.investmentHighlights = [
      "Rental income distribution",
      "Property appreciation potential",
      "Inflation hedge asset",
      "Tangible asset backing"
    ];
    enrichment.riskFactors = [
      "Real estate market cycles",
      "Property maintenance costs",
      "Location-specific risks",
      "Liquidity constraints"
    ];
    enrichment.expectedReturns = right.paysDividends ? "Monthly rental income + appreciation" : "Capital appreciation only";
    enrichment.marketContext = "Real estate tokenization - $3.7T addressable market";
    enrichment.buyerBenefits = [
      "Fractional property ownership",
      "Rental income rights",
      "Property appreciation upside",
      "Professional management"
    ];
    enrichment.technicalDetails = [
      "Property deed verification",
      "Ownership percentage documented",
      "Property management agreement"
    ];
  }

  // Software Licensing
  else if (contentSource === "software" && rightType === "license") {
    enrichment.displayIcon = Code;
    enrichment.displayTitle = `Software License - ${right.title}`;
    enrichment.contextualDescription = `Commercial software licensing rights for: ${right.title}`;
    enrichment.investmentHighlights = [
      "Recurring license revenue",
      "Enterprise market access",
      "Scalable distribution",
      "High margin potential"
    ];
    enrichment.riskFactors = [
      "Technology obsolescence",
      "Competition from alternatives",
      "Support obligations"
    ];
    enrichment.expectedReturns = "Per-license fee + maintenance revenue";
    enrichment.marketContext = "Software licensing market - $650B annually";
    enrichment.buyerBenefits = [
      "Commercial usage rights",
      "Distribution licensing",
      "Modification permissions",
      "Territory-specific rights"
    ];
  }

  // Brand/Trademark Licensing
  else if (contentSource === "brand" && rightType === "license") {
    enrichment.displayIcon = Trademark;
    enrichment.displayTitle = `Brand License - ${right.title}`;
    enrichment.contextualDescription = `Trademark and brand licensing rights for: ${right.title}`;
    enrichment.investmentHighlights = [
      "Brand recognition value",
      "Multi-category licensing",
      "Geographic expansion",
      "Premium pricing power"
    ];
    enrichment.riskFactors = [
      "Brand reputation risks",
      "Market acceptance",
      "Trademark disputes"
    ];
    enrichment.expectedReturns = "Licensing fees + royalty percentages";
    enrichment.marketContext = "Brand licensing industry - $320B global market";
    enrichment.buyerBenefits = [
      "Brand usage rights",
      "Marketing material access",
      "Territory exclusivity options",
      "Category licensing"
    ];
  }

  // Patent Royalties
  else if (contentSource === "patent" && rightType === "royalty") {
    enrichment.displayIcon = Briefcase;
    enrichment.displayTitle = `Patent Royalty Stream - ${right.title}`;
    enrichment.contextualDescription = `Ongoing patent royalty revenue share for: ${right.title}`;
    enrichment.investmentHighlights = [
      "Established licensee base",
      "Technology adoption growth",
      "Recurring revenue stream",
      "Legal protection backing"
    ];
    enrichment.riskFactors = [
      "Patent expiration date",
      "Technology supersession",
      "Licensee payment defaults"
    ];
    enrichment.expectedReturns = "Quarterly royalty distributions";
    enrichment.marketContext = "Patent licensing market - $360B annually";
    enrichment.buyerBenefits = [
      "Patent royalty income",
      "Technology licensing revenue",
      "Industry adoption upside",
      "Legal enforcement rights"
    ];
  }

  // Access Rights
  else if (rightType === "access") {
    enrichment.displayIcon = Key;
    enrichment.displayTitle = `Exclusive Access Rights - ${right.title}`;
    enrichment.contextualDescription = `Exclusive access privileges for: ${right.title}`;
    enrichment.investmentHighlights = [
      "Exclusive member benefits",
      "Limited availability",
      "Premium access tiers",
      "Community membership"
    ];
    enrichment.riskFactors = [
      "Service discontinuation",
      "Access policy changes",
      "Platform dependency"
    ];
    enrichment.expectedReturns = "Exclusive access value + potential resale";
    enrichment.marketContext = "Premium access market growing rapidly";
    enrichment.buyerBenefits = [
      "Exclusive content access",
      "Priority service benefits",
      "Community membership",
      "Transferable rights"
    ];
  }

  return enrichment;
}

// Get investment risk level based on right type and content source
export function getRiskLevel(right: RightWithCreator): "low" | "medium" | "high" {
  const contentSource = right.contentSource;
  const rightType = right.type;

  // YouTube is generally lower risk due to established platform
  if (contentSource === "youtube_video") return "low";
  
  // Real estate ownership is typically medium risk
  if (contentSource === "real_estate" && rightType === "ownership") return "medium";
  
  // Patent royalties can be high risk due to expiration
  if (contentSource === "patent" && rightType === "royalty") return "high";
  
  // Music and brand licensing are medium risk
  if (contentSource === "music_track" || contentSource === "brand") return "medium";
  
  // Default to medium risk
  return "medium";
}

// Get estimated yield category
export function getYieldCategory(right: RightWithCreator): "low" | "medium" | "high" {
  if (!right.paysDividends) return "low";
  
  const contentSource = right.contentSource;
  const rightType = right.type;
  
  // Revenue-generating assets
  if (rightType === "royalty") return "high";
  if (contentSource === "real_estate" && right.paysDividends) return "medium";
  if (contentSource === "youtube_video" && rightType === "copyright") return "medium";
  
  return "low";
}