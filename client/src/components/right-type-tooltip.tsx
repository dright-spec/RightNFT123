import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { HelpCircle, Check } from "lucide-react";

interface RightTypeTooltipProps {
  type: string;
}

const rightTypeGuidance = {
  copyright: {
    title: "Copyright Rights",
    description: "Own intellectual property rights to creative works",
    examples: [
      "Song streaming royalties from Spotify, Apple Music",
      "Book publishing and distribution rights",
      "Movie/TV show licensing and syndication",
      "Software licensing and distribution",
      "Photography and image licensing",
      "Art reproduction and merchandise rights"
    ],
    requirements: [
      "Must own or control the copyright",
      "Provide proof of creation or ownership",
      "Upload actual content file for verification"
    ],
    revenueTypes: [
      "Streaming royalties (monthly/quarterly)",
      "Licensing fees (per use or annual)",
      "Distribution revenue shares",
      "Merchandise and reproduction rights"
    ]
  },
  royalty: {
    title: "Royalty Rights",
    description: "Earn ongoing revenue from existing assets or content",
    examples: [
      "Music performance royalties from radio/TV",
      "Patent licensing royalties from manufacturers",
      "Franchise royalty payments",
      "Brand licensing revenue",
      "YouTube ad revenue from viral videos",
      "App store revenue from mobile apps"
    ],
    requirements: [
      "Documented revenue history",
      "Legal agreements showing royalty entitlement",
      "Transparent payment distribution method"
    ],
    revenueTypes: [
      "Performance royalties (streaming)",
      "Mechanical royalties (per play/download)",
      "Licensing fees (ongoing percentage)",
      "Ad revenue sharing"
    ]
  },
  access: {
    title: "Access Rights",
    description: "Exclusive access privileges and membership benefits",
    examples: [
      "VIP concert and event access",
      "Exclusive online community membership",
      "Private Discord server access",
      "Early product access and beta testing",
      "Backstage passes and meet & greets",
      "Premium course and content access"
    ],
    requirements: [
      "Ability to provide exclusive access",
      "Clear terms of access privileges",
      "Transferability confirmation"
    ],
    revenueTypes: [
      "One-time access fees",
      "Membership renewal revenue",
      "Resale value appreciation",
      "Secondary market trading"
    ]
  },
  ownership: {
    title: "Ownership Rights",
    description: "Fractional ownership of physical or digital assets",
    examples: [
      "Real estate rental income shares",
      "Business equity and profit sharing",
      "Collectible item ownership (art, cars)",
      "Domain name ownership rights",
      "Equipment rental revenue (studios, tools)",
      "Investment property appreciation"
    ],
    requirements: [
      "Legal proof of ownership",
      "Asset valuation documentation",
      "Revenue distribution mechanism"
    ],
    revenueTypes: [
      "Rental income (monthly)",
      "Asset appreciation gains",
      "Business profit distributions",
      "Usage fees and licensing"
    ]
  },
  license: {
    title: "License Rights",
    description: "Technology and process licensing opportunities",
    examples: [
      "Software algorithm licensing",
      "Manufacturing process patents",
      "Technology platform usage rights",
      "Trade secret licensing",
      "Formula and recipe licensing (Coca-Cola style)",
      "Brand and trademark usage rights"
    ],
    requirements: [
      "Patent or trade secret documentation",
      "Proof of uniqueness and value",
      "Legal right to license"
    ],
    revenueTypes: [
      "Licensing fees (upfront + ongoing)",
      "Revenue percentage from licensees",
      "Per-unit royalties",
      "Territorial licensing fees"
    ]
  }
};

export function RightTypeTooltip({ type }: RightTypeTooltipProps) {
  const guidance = rightTypeGuidance[type as keyof typeof rightTypeGuidance];
  
  if (!guidance) return null;

  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <HelpCircle className="h-4 w-4 text-muted-foreground" />
        </Button>
      </HoverCardTrigger>
      <HoverCardContent className="w-96 p-6" side="right" align="start">
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-foreground">{guidance.title}</h4>
            <p className="text-sm text-muted-foreground mt-1">{guidance.description}</p>
          </div>
          
          <div>
            <h5 className="font-medium text-sm text-foreground mb-2">What You Can Tokenize:</h5>
            <ul className="space-y-1">
              {guidance.examples.map((example, index) => (
                <li key={index} className="flex items-start gap-2 text-xs">
                  <Check className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{example}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h5 className="font-medium text-sm text-foreground mb-2">Requirements:</h5>
            <ul className="space-y-1">
              {guidance.requirements.map((req, index) => (
                <li key={index} className="flex items-start gap-2 text-xs">
                  <div className="h-1.5 w-1.5 bg-primary rounded-full mt-1.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{req}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h5 className="font-medium text-sm text-foreground mb-2">Revenue Types:</h5>
            <ul className="space-y-1">
              {guidance.revenueTypes.map((revenue, index) => (
                <li key={index} className="flex items-start gap-2 text-xs">
                  <div className="h-1.5 w-1.5 bg-green-600 rounded-full mt-1.5 flex-shrink-0" />
                  <span className="text-muted-foreground">{revenue}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}