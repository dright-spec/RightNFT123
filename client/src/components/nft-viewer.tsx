import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Hash, Copy, Check, Eye, Music, Video, FileText, Palette, Code, Building, Book, Lightbulb } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { YouTubeEmbed } from "@/components/youtube-embed";

interface NFTViewerProps {
  nftData: {
    tokenId: string;
    serialNumber: number;
    transactionId: string;
    explorerUrl?: string;
    name?: string;
    symbol?: string;
    metadata?: any;
    rightType?: string;
    contentSource?: string;
    youtubeVideoId?: string;
  };
  className?: string;
}

export function NFTViewer({ nftData, className = "" }: NFTViewerProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
    toast({
      title: "Copied",
      description: `${type} copied to clipboard`,
    });
  };

  const fullNFTId = `${nftData.tokenId}/${nftData.serialNumber}`;

  // Get icon and colors based on right type
  const getRightTypeDisplay = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'copyright':
        return { icon: FileText, color: 'from-blue-500 to-indigo-600', bg: 'bg-blue-50', border: 'border-blue-200' };
      case 'royalty':
        return { icon: Music, color: 'from-purple-500 to-pink-600', bg: 'bg-purple-50', border: 'border-purple-200' };
      case 'access':
        return { icon: Eye, color: 'from-green-500 to-emerald-600', bg: 'bg-green-50', border: 'border-green-200' };
      case 'ownership':
        return { icon: Building, color: 'from-amber-500 to-orange-600', bg: 'bg-amber-50', border: 'border-amber-200' };
      case 'license':
        return { icon: Code, color: 'from-teal-500 to-cyan-600', bg: 'bg-teal-50', border: 'border-teal-200' };
      case 'youtube video':
        return { icon: Video, color: 'from-red-500 to-rose-600', bg: 'bg-red-50', border: 'border-red-200' };
      case 'music track':
        return { icon: Music, color: 'from-purple-500 to-violet-600', bg: 'bg-purple-50', border: 'border-purple-200' };
      case 'artwork':
        return { icon: Palette, color: 'from-pink-500 to-rose-600', bg: 'bg-pink-50', border: 'border-pink-200' };
      case 'book':
        return { icon: Book, color: 'from-brown-500 to-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
      default:
        return { icon: Lightbulb, color: 'from-gray-500 to-slate-600', bg: 'bg-gray-50', border: 'border-gray-200' };
    }
  };

  const rightDisplay = getRightTypeDisplay(nftData.rightType);
  const IconComponent = rightDisplay.icon;

  // Extract YouTube video ID from content source or metadata
  const getYouTubeVideoId = () => {
    if (nftData.youtubeVideoId) return nftData.youtubeVideoId;
    
    // Try to extract from content source
    if (nftData.contentSource && nftData.contentSource.includes('youtube')) {
      const match = nftData.contentSource.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
      return match ? match[1] : null;
    }
    
    // Try to extract from metadata
    if (nftData.metadata && typeof nftData.metadata === 'object') {
      const metadataStr = JSON.stringify(nftData.metadata);
      const match = metadataStr.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
      return match ? match[1] : null;
    }
    
    return null;
  };

  const youtubeVideoId = getYouTubeVideoId();
  const isYouTubeVideo = nftData.rightType?.toLowerCase().includes('youtube') || 
                        nftData.contentSource?.toLowerCase().includes('youtube') ||
                        youtubeVideoId;

  return (
    <Card className={`bg-gradient-to-br ${rightDisplay.bg} to-white ${rightDisplay.border} shadow-lg ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-800">
          <IconComponent className="w-5 h-5" />
          NFT Successfully Minted
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* NFT Visual Representation */}
        <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-6 text-center relative overflow-hidden">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="grid grid-cols-8 gap-2 h-full">
              {[...Array(64)].map((_, i) => (
                <div key={i} className={`bg-gradient-to-br ${rightDisplay.color} rounded`}></div>
              ))}
            </div>
          </div>
          
          {/* Main NFT visual */}
          <div className="relative z-10">
            {isYouTubeVideo && youtubeVideoId ? (
              // YouTube Video Embed
              <div className="mb-6">
                <div className="relative w-full max-w-sm mx-auto">
                  <YouTubeEmbed 
                    videoId={youtubeVideoId}
                    title={nftData.name || "YouTube Video Rights"}
                    className="rounded-xl border-2 border-red-200"
                    showControls={true}
                    autoplay={false}
                  />
                  <div className="absolute -top-2 -right-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                    NFT
                  </div>
                </div>
              </div>
            ) : (
              // Default Icon Display
              <div className={`w-24 h-24 bg-gradient-to-br ${rightDisplay.color} rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300`}>
                <IconComponent className="w-12 h-12 text-white" />
              </div>
            )}
            
            <h3 className="font-bold text-2xl text-gray-800 mb-2">
              {nftData.name || "Hedera NFT"}
            </h3>
            {nftData.rightType && (
              <div className="text-sm text-gray-600 mb-2 font-medium">
                {nftData.rightType.charAt(0).toUpperCase() + nftData.rightType.slice(1)} Rights
              </div>
            )}
            {nftData.symbol && (
              <div className="text-sm text-gray-500 mb-4">
                Symbol: {nftData.symbol}
              </div>
            )}
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium shadow-sm">
              <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
              Live on Hedera Testnet
            </div>
          </div>
        </div>

        {/* NFT Identifier Showcase */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-lg text-white text-center">
          <p className="text-xs font-medium opacity-90 mb-2">COMPLETE NFT IDENTIFIER</p>
          <div className="flex items-center justify-center gap-3">
            <p className="font-mono text-2xl font-bold tracking-wider">
              {fullNFTId}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(fullNFTId, 'NFT ID')}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              {copied === 'NFT ID' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Detailed Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <p className="text-xs font-medium text-gray-500 mb-2">TOKEN ID</p>
            <div className="flex items-center justify-between">
              <p className="font-mono text-sm font-bold text-gray-800">
                {nftData.tokenId}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(nftData.tokenId, 'Token ID')}
                className="h-6 w-6 p-0"
              >
                {copied === 'Token ID' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <p className="text-xs font-medium text-gray-500 mb-2">SERIAL NUMBER</p>
            <p className="font-mono text-sm font-bold text-gray-800">
              #{nftData.serialNumber}
            </p>
          </div>
        </div>

        {/* Transaction Information */}
        <div className="bg-gray-50 p-4 rounded-lg border">
          <p className="text-xs font-medium text-gray-500 mb-2">TRANSACTION HASH</p>
          <div className="flex items-start gap-2">
            <p className="font-mono text-xs text-gray-700 break-all leading-relaxed flex-1">
              {nftData.transactionId}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(nftData.transactionId, 'Transaction Hash')}
              className="h-6 w-6 p-0 flex-shrink-0"
            >
              {copied === 'Transaction Hash' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        {/* Metadata Display */}
        {nftData.metadata && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-xs font-medium text-yellow-700 mb-2">NFT METADATA</p>
            <pre className="text-xs text-yellow-800 whitespace-pre-wrap font-mono">
              {typeof nftData.metadata === 'string' 
                ? nftData.metadata 
                : JSON.stringify(nftData.metadata, null, 2)
              }
            </pre>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {nftData.explorerUrl && (
            <Button
              variant="outline"
              onClick={() => {
                console.log('Opening NFT explorer URL:', nftData.explorerUrl);
                window.open(nftData.explorerUrl, '_blank');
              }}
              className="flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on HashScan
            </Button>
          )}
          <Button
            onClick={() => copyToClipboard(JSON.stringify(nftData, null, 2), 'Complete NFT Data')}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Hash className="h-4 w-4 mr-2" />
            Copy All Data
          </Button>
        </div>

        {/* Success Message with Instructions */}
        <div className="text-center text-sm text-green-700 bg-green-100 p-4 rounded-lg border border-green-200">
          <div className="font-semibold mb-2">🎉 Congratulations! Your NFT is Live</div>
          <div className="text-xs leading-relaxed">
            This is a real NFT minted on Hedera testnet blockchain. You can now:
            <br />• View it on HashScan explorer • Share the NFT ID with others • Transfer ownership • Use in applications
          </div>
        </div>
      </CardContent>
    </Card>
  );
}