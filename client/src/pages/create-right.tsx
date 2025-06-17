import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { insertRightSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { VerificationWorkflow } from "@/components/verification-workflow";
import { MultiVideoPricing } from "@/components/multi-video-pricing";
import { FeeInfo } from "@/components/fee-info";
import { YouTubeOwnershipVerifier } from "@/components/youtube-ownership-verifier";
import { ethereumService } from "@/lib/ethereum";
import { ethereumWallet } from "@/lib/ethereumWallet";
import { ArrowLeft, Upload, FileText, Shield, DollarSign, Eye, Check, X, Youtube, Link2, Music, Film, Image, FileVideo, Zap, Star, Crown, AlertCircle } from "lucide-react";
import { z } from "zod";

// Extended form schema for the create right page
const createRightFormSchema = insertRightSchema.extend({
  tags: z.array(z.string()).optional(),
  youtubeUrl: z.string().optional(),
  verificationMethod: z.enum(["youtube", "manual", "documents"]).optional(),
  contentSource: z.enum(["youtube_video", "music_track", "patent", "real_estate", "artwork", "software", "brand", "book", "other"]).default("youtube_video"),
});

type CreateRightFormData = z.infer<typeof createRightFormSchema>;

const rightTypes = [
  { value: "copyright", label: "Copyright", icon: FileText, description: "Intellectual property rights to creative works", symbol: "©" },
  { value: "royalty", label: "Royalty", icon: DollarSign, description: "Ongoing revenue streams from existing assets", symbol: "💰" },
  { value: "access", label: "Access", icon: Eye, description: "Exclusive access rights to content or services", symbol: "🔑" },
  { value: "ownership", label: "Ownership", icon: Crown, description: "Direct ownership stakes in assets", symbol: "👑" },
  { value: "license", label: "License", icon: Shield, description: "Usage permissions and licensing rights", symbol: "🔐" },
];

export default function CreateRight() {
  const [, setLocation] = useLocation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ownershipFiles, setOwnershipFiles] = useState<File[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoDetails, setVideoDetails] = useState<any>(null);
  const [selectedVideos, setSelectedVideos] = useState<any[]>([]);
  const [verificationData, setVerificationData] = useState<any>(null);
  const [canMintNFT, setCanMintNFT] = useState(false);
  const [videoPricingData, setVideoPricingData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ownershipInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CreateRightFormData>({
    resolver: zodResolver(createRightFormSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "copyright",
      price: "",
      currency: "HBAR",
      paysDividends: false,
      tags: [],
      contentSource: "youtube_video",
    },
  });

  const createRightMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("/api/rights", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rights"] });
      toast({
        title: "Right Created Successfully!",
        description: "Your right has been submitted for verification.",
      });
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast({
        title: "Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create right",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'main' | 'ownership') => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (type === 'main') {
      setSelectedFile(files[0]);
    } else {
      setOwnershipFiles(Array.from(files));
    }
  };

  const verifyYouTube = async () => {
    if (!youtubeUrl) return;
    
    setIsVerifying(true);
    try {
      const response = await apiRequest("/api/youtube/verify", "POST", { url: youtubeUrl });
      setVideoDetails(response);
      toast({
        title: "YouTube Video Verified!",
        description: "Video ownership confirmed successfully.",
      });
    } catch (error) {
      toast({
        title: "Verification Failed",
        description: "Could not verify YouTube ownership. Please check the URL and try again.",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerificationComplete = (data: any) => {
    setVerificationData(data);
    if (data.youtubeData && data.youtubeData.videos) {
      setSelectedVideos(data.youtubeData.videos);
      setCurrentStep(3); // Move to pricing step for multiple videos
    } else {
      setCurrentStep(3); // Move to regular pricing step
    }
  };

  const handleCanMintNFT = (canMint: boolean) => {
    setCanMintNFT(canMint);
  };

  const handleMultipleVideosSelected = (videos: any[]) => {
    setSelectedVideos(videos);
    setCurrentStep(3); // Move to pricing step
  };

  const handlePricingComplete = (pricingData: any[]) => {
    setVideoPricingData(pricingData);
    setCurrentStep(4); // Move to final confirmation step
  };

  const onSubmit = async (data: CreateRightFormData) => {
    // Check wallet connection
    const walletState = ethereumWallet.getState();
    if (!walletState.isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your MetaMask wallet to create rights NFTs.",
        variant: "destructive",
      });
      return;
    }

    // Verify that verification is complete before allowing submission
    if (!canMintNFT && selectedVideos.length === 0) {
      toast({
        title: "Verification Required",
        description: "Please complete the verification process before minting your NFT.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Handle multiple video NFT creation with individual pricing
      if (selectedVideos.length > 0 && videoPricingData.length > 0) {
        const progressIncrement = 100 / selectedVideos.length;
        
        for (let i = 0; i < selectedVideos.length; i++) {
          const video = selectedVideos[i];
          const pricing = videoPricingData.find(p => p.videoId === video.id);
          
          if (pricing) {
            setUploadProgress((i + 0.3) * progressIncrement);
            
            // Create NFT metadata
            const metadata = {
              title: video.title,
              description: video.description || `YouTube video: ${video.title}`,
              type: data.type as any,
              dividends: pricing.paysDividends,
              payout_address: walletState.accountAddress!,
              image_uri: video.thumbnails.high.url,
              creator: walletState.accountAddress!,
              created_at: new Date().toISOString()
            };

            // Mint NFT on Ethereum
            const mintResult = await ethereumService.mintNFT(metadata);
            
            setUploadProgress((i + 0.7) * progressIncrement);

            const rightData = {
              title: video.title,
              description: video.description || `YouTube video: ${video.title}`,
              type: data.type,
              imageUrl: video.thumbnails.high.url,
              contentFileUrl: `https://www.youtube.com/watch?v=${video.id}`,
              tags: [video.channelTitle, 'YouTube', 'Video Content'],
              listingType: pricing.listingType,
              price: pricing.price,
              currency: "ETH",
              royaltyPercentage: pricing.royaltyPercentage.toString(),
              paysDividends: pricing.paysDividends,
              startingBid: pricing.startingBid,
              reservePrice: pricing.reservePrice,
              auctionDuration: pricing.auctionDuration,
              verificationStatus: 'verified',
              isListed: true,
              // Ethereum NFT data
              ethereumTokenId: mintResult.tokenId,
              ethereumContractAddress: mintResult.contractAddress,
              ethereumTransactionHash: mintResult.transactionHash,
              ethereumMetadataUri: mintResult.metadataUri,
              ethereumWalletAddress: walletState.accountAddress,
              ethereumNetwork: walletState.network,
            };

            await createRightMutation.mutateAsync(rightData);
            setUploadProgress((i + 1) * progressIncrement);
          }
        }

        toast({
          title: `${selectedVideos.length} NFTs Created Successfully!`,
          description: `All video NFTs have been minted on Ethereum with smart contract automation.`,
        });
      } else {
        // Single NFT creation (existing flow)
        setUploadProgress(20);
        
        // Create NFT metadata
        const metadata = {
          title: data.title,
          description: data.description,
          type: data.type as any,
          dividends: data.paysDividends || false,
          payout_address: walletState.accountAddress!,
          creator: walletState.accountAddress!,
          created_at: new Date().toISOString()
        };

        setUploadProgress(40);

        // Mint NFT on Ethereum
        const mintResult = await ethereumService.mintNFT(metadata, selectedFile || undefined);
        
        setUploadProgress(70);

        const rightData = {
          ...data,
          imageUrl: selectedFile ? URL.createObjectURL(selectedFile) : null,
          youtubeUrl: youtubeUrl || null,
          verificationStatus: verificationData?.status || "pending",
          verificationMethod: verificationData?.method || "manual",
          verificationFiles: verificationData?.files || [],
          youtubeData: verificationData?.youtubeData,
          isListed: true,
          currency: "ETH",
          // Ethereum NFT data
          ethereumTokenId: mintResult.tokenId,
          ethereumContractAddress: mintResult.contractAddress,
          ethereumTransactionHash: mintResult.transactionHash,
          ethereumMetadataUri: mintResult.metadataUri,
          ethereumWalletAddress: walletState.accountAddress,
          ethereumNetwork: walletState.network,
        };

        setUploadProgress(90);
        await createRightMutation.mutateAsync(rightData);
        setUploadProgress(100);
      }
    } catch (error) {
      toast({
        title: "NFT Creation Failed",
        description: error instanceof Error ? error.message : "Failed to create rights NFT",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const steps = [
    { number: 1, title: "Content & Details", description: "Add your content and basic information" },
    { number: 2, title: "Verification", description: "Verify ownership and authenticity" },
    { number: 3, title: "Pricing & Terms", description: "Set pricing and payment terms" },
    { number: 4, title: "Review & Submit", description: "Review and publish your right" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <header className="bg-background shadow-sm border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/" className="flex-shrink-0">
                <h1 className="text-xl font-bold text-primary">
                  D<span className="text-accent">right</span>
                </h1>
              </Link>
              <div className="h-6 w-px bg-border"></div>
              <nav className="flex items-center space-x-1">
                <Link href="/" className="text-sm text-muted-foreground hover:text-foreground px-3 py-2 rounded-md transition-colors">
                  Marketplace
                </Link>
                <span className="text-muted-foreground">/</span>
                <span className="text-sm font-medium px-3 py-2">Create Right</span>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.number
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'border-muted-foreground text-muted-foreground'
                }`}>
                  {currentStep > step.number ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.number}</span>
                  )}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${
                    currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden sm:block w-16 h-px mx-4 ${
                    currentStep > step.number ? 'bg-primary' : 'bg-border'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Step 1: Content & Details */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                {/* Content Source Selection - Prominent YouTube Option */}
                <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Youtube className="w-6 h-6 text-red-600" />
                      What are you selling?
                    </CardTitle>
                    <CardDescription className="text-base">
                      Choose your content source to get started with streamlined verification
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="contentSource"
                      render={({ field }) => (
                        <FormItem>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* YouTube Video Copyright - Featured Option */}
                            <Card
                              className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                                field.value === 'youtube_video'
                                  ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800'
                                  : 'hover:bg-muted/50 border-border'
                              }`}
                              onClick={() => {
                                field.onChange('youtube_video');
                                form.setValue('type', 'copyright');
                              }}
                            >
                              <CardContent className="p-4 text-center">
                                <div className="relative">
                                  <Youtube className="w-10 h-10 mx-auto mb-2 text-red-600" />
                                  {field.value === 'youtube_video' && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                      <Check className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                </div>
                                <h3 className="font-semibold text-base mb-1">YouTube Video</h3>
                                <p className="text-xs text-muted-foreground mb-2">
                                  Video copyright with instant verification
                                </p>
                                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs">
                                  Auto-Verified
                                </Badge>
                              </CardContent>
                            </Card>

                            {/* Music Track */}
                            <Card
                              className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                                field.value === 'music_track'
                                  ? 'ring-2 ring-primary bg-primary/5 border-primary/50'
                                  : 'hover:bg-muted/50 border-border'
                              }`}
                              onClick={() => {
                                field.onChange('music_track');
                                form.setValue('type', 'copyright');
                              }}
                            >
                              <CardContent className="p-4 text-center">
                                <div className="relative">
                                  <Music className="w-10 h-10 mx-auto mb-2 text-primary" />
                                  {field.value === 'music_track' && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                      <Check className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                </div>
                                <h3 className="font-semibold text-base mb-1">Music Track</h3>
                                <p className="text-xs text-muted-foreground mb-2">
                                  Song, album, or musical composition
                                </p>
                                <Badge variant="outline" className="text-xs">Upload Required</Badge>
                              </CardContent>
                            </Card>

                            {/* Patent */}
                            <Card
                              className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                                field.value === 'patent'
                                  ? 'ring-2 ring-primary bg-primary/5 border-primary/50'
                                  : 'hover:bg-muted/50 border-border'
                              }`}
                              onClick={() => {
                                field.onChange('patent');
                                form.setValue('type', 'license');
                              }}
                            >
                              <CardContent className="p-4 text-center">
                                <div className="relative">
                                  <Shield className="w-10 h-10 mx-auto mb-2 text-blue-600" />
                                  {field.value === 'patent' && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                      <Check className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                </div>
                                <h3 className="font-semibold text-base mb-1">Patent</h3>
                                <p className="text-xs text-muted-foreground mb-2">
                                  Technology, invention, or process patent
                                </p>
                                <Badge variant="outline" className="text-xs">Documentation</Badge>
                              </CardContent>
                            </Card>

                            {/* Real Estate */}
                            <Card
                              className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                                field.value === 'real_estate'
                                  ? 'ring-2 ring-primary bg-primary/5 border-primary/50'
                                  : 'hover:bg-muted/50 border-border'
                              }`}
                              onClick={() => {
                                field.onChange('real_estate');
                                form.setValue('type', 'ownership');
                              }}
                            >
                              <CardContent className="p-4 text-center">
                                <div className="relative">
                                  <Crown className="w-10 h-10 mx-auto mb-2 text-purple-600" />
                                  {field.value === 'real_estate' && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                      <Check className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                </div>
                                <h3 className="font-semibold text-base mb-1">Real Estate</h3>
                                <p className="text-xs text-muted-foreground mb-2">
                                  Property ownership or rental rights
                                </p>
                                <Badge variant="outline" className="text-xs">Legal Docs</Badge>
                              </CardContent>
                            </Card>

                            {/* Artwork */}
                            <Card
                              className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                                field.value === 'artwork'
                                  ? 'ring-2 ring-primary bg-primary/5 border-primary/50'
                                  : 'hover:bg-muted/50 border-border'
                              }`}
                              onClick={() => {
                                field.onChange('artwork');
                                form.setValue('type', 'copyright');
                              }}
                            >
                              <CardContent className="p-4 text-center">
                                <div className="relative">
                                  <Star className="w-10 h-10 mx-auto mb-2 text-orange-600" />
                                  {field.value === 'artwork' && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                      <Check className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                </div>
                                <h3 className="font-semibold text-base mb-1">Artwork</h3>
                                <p className="text-xs text-muted-foreground mb-2">
                                  Digital art, photography, or design
                                </p>
                                <Badge variant="outline" className="text-xs">Upload Image</Badge>
                              </CardContent>
                            </Card>

                            {/* Software */}
                            <Card
                              className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                                field.value === 'software'
                                  ? 'ring-2 ring-primary bg-primary/5 border-primary/50'
                                  : 'hover:bg-muted/50 border-border'
                              }`}
                              onClick={() => {
                                field.onChange('software');
                                form.setValue('type', 'license');
                              }}
                            >
                              <CardContent className="p-4 text-center">
                                <div className="relative">
                                  <FileText className="w-10 h-10 mx-auto mb-2 text-green-600" />
                                  {field.value === 'software' && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                      <Check className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                </div>
                                <h3 className="font-semibold text-base mb-1">Software</h3>
                                <p className="text-xs text-muted-foreground mb-2">
                                  Code, app, or software licensing
                                </p>
                                <Badge variant="outline" className="text-xs">Repository</Badge>
                              </CardContent>
                            </Card>

                            {/* Brand */}
                            <Card
                              className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                                field.value === 'brand'
                                  ? 'ring-2 ring-primary bg-primary/5 border-primary/50'
                                  : 'hover:bg-muted/50 border-border'
                              }`}
                              onClick={() => {
                                field.onChange('brand');
                                form.setValue('type', 'license');
                              }}
                            >
                              <CardContent className="p-4 text-center">
                                <div className="relative">
                                  <Zap className="w-10 h-10 mx-auto mb-2 text-yellow-600" />
                                  {field.value === 'brand' && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                      <Check className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                </div>
                                <h3 className="font-semibold text-base mb-1">Brand</h3>
                                <p className="text-xs text-muted-foreground mb-2">
                                  Trademark, logo, or brand licensing
                                </p>
                                <Badge variant="outline" className="text-xs">Trademark</Badge>
                              </CardContent>
                            </Card>

                            {/* Book */}
                            <Card
                              className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                                field.value === 'book'
                                  ? 'ring-2 ring-primary bg-primary/5 border-primary/50'
                                  : 'hover:bg-muted/50 border-border'
                              }`}
                              onClick={() => {
                                field.onChange('book');
                                form.setValue('type', 'copyright');
                              }}
                            >
                              <CardContent className="p-4 text-center">
                                <div className="relative">
                                  <FileText className="w-10 h-10 mx-auto mb-2 text-indigo-600" />
                                  {field.value === 'book' && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                      <Check className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                </div>
                                <h3 className="font-semibold text-base mb-1">Book</h3>
                                <p className="text-xs text-muted-foreground mb-2">
                                  Written work, e-book, or publication
                                </p>
                                <Badge variant="outline" className="text-xs">Copyright</Badge>
                              </CardContent>
                            </Card>

                            {/* Other */}
                            <Card
                              className={`cursor-pointer transition-all hover:shadow-lg border-2 ${
                                field.value === 'other'
                                  ? 'ring-2 ring-primary bg-primary/5 border-primary/50'
                                  : 'hover:bg-muted/50 border-border'
                              }`}
                              onClick={() => field.onChange('other')}
                            >
                              <CardContent className="p-4 text-center">
                                <div className="relative">
                                  <Upload className="w-10 h-10 mx-auto mb-2 text-gray-600" />
                                  {field.value === 'other' && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                      <Check className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                </div>
                                <h3 className="font-semibold text-base mb-1">Other</h3>
                                <p className="text-xs text-muted-foreground mb-2">
                                  Custom or specialized rights
                                </p>
                                <Badge variant="outline" className="text-xs">Manual Review</Badge>
                              </CardContent>
                            </Card>
                          </div>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Right Information
                    </CardTitle>
                    <CardDescription>
                      {form.watch("contentSource") === "youtube_video" 
                        ? "Since you're selling YouTube video copyright, we'll help you select and verify your videos in the next step"
                        : "Provide the basic details about your digital right"
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Right Type Selection - Auto-filled for YouTube */}
                    {form.watch("contentSource") === "youtube_video" ? (
                      <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                            <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                          </div>
                          <div>
                            <h4 className="font-medium text-green-800 dark:text-green-200">Copyright Selected</h4>
                            <p className="text-sm text-green-600 dark:text-green-400">
                              Perfect for YouTube video ownership rights
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Right Type *</FormLabel>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {rightTypes.map((type) => {
                                const Icon = type.icon;
                                return (
                                  <Card
                                    key={type.value}
                                    className={`cursor-pointer transition-all hover:shadow-md ${
                                      field.value === type.value
                                        ? 'ring-2 ring-primary bg-primary/5'
                                        : 'hover:bg-muted/50'
                                    }`}
                                    onClick={() => field.onChange(type.value)}
                                  >
                                    <CardContent className="p-4 text-center">
                                      <Icon className="w-8 h-8 mx-auto mb-2 text-primary" />
                                      <h4 className="font-medium text-sm">{type.label}</h4>
                                      <p className="text-xs text-muted-foreground mt-1">{type.description}</p>
                                    </CardContent>
                                  </Card>
                                );
                              })}
                            </div>
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Conditional Fields Based on Content Source */}
                    {form.watch("contentSource") === "youtube_video" ? (
                      // YouTube-specific simplified form
                      <div className="space-y-4">
                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Youtube className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                              <p className="font-medium text-blue-800 dark:text-blue-200">
                                Quick Setup for YouTube Videos
                              </p>
                              <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                                We'll help you select your videos and auto-fill details in the next step. 
                                For now, just provide a brief overview of what you're selling.
                              </p>
                            </div>
                          </div>
                        </div>

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>What are you selling? *</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Briefly describe the YouTube video copyright you're selling (e.g., 'Copyright to my tutorial series on web development' or 'Ownership rights to my music videos')"
                                  className="min-h-[100px] resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Keep it simple - we'll add video-specific details automatically
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    ) : (
                      // Standard form for other content types
                      <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Title *</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter a descriptive title" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {form.watch("contentSource") !== "youtube_video" && (
                            <div>
                              <label className="text-sm font-medium mb-2 block">Content File</label>
                              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
                                <input
                                  ref={fileInputRef}
                                  type="file"
                                  accept="image/*,video/*,audio/*,.pdf"
                                  onChange={(e) => handleFileUpload(e, 'main')}
                                  className="hidden"
                                />
                                <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                                <div>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => fileInputRef.current?.click()}
                                  >
                                    Choose File
                                  </Button>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    {selectedFile ? selectedFile.name : 'Support: images, videos, audio, documents'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description *</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe your right, its uniqueness, and what buyers will receive..."
                                  className="min-h-[120px] resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Provide details about ownership, usage rights, and any restrictions
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    disabled={
                      form.watch("contentSource") === "youtube_video" 
                        ? !form.watch("description")
                        : !form.watch("title") || !form.watch("description")
                    }
                    className="px-8"
                  >
                    {form.watch("contentSource") === "youtube_video" 
                      ? "Next: Connect YouTube" 
                      : "Next: Verification"
                    }
                    <Shield className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Verification */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                {form.watch("contentSource") === "youtube_video" ? (
                  <YouTubeOwnershipVerifier
                    onVerified={(videoData) => {
                      setSelectedVideos([videoData]);
                      setCanMintNFT(true);
                      form.setValue("title", videoData.title);
                      form.setValue("description", videoData.description);
                      form.setValue("youtubeUrl", videoData.url);
                      toast({
                        title: "Ownership Verified Successfully!",
                        description: "Your YouTube channel ownership has been confirmed. Ready for NFT minting.",
                      });
                    }}
                    onError={(error) => {
                      toast({
                        title: "Ownership Verification Failed",
                        description: error,
                        variant: "destructive",
                      });
                    }}
                  />
                ) : (
                  <VerificationWorkflow 
                    rightType={form.watch("type") || "copyright"}
                    initialYouTubeUrl={form.watch("youtubeUrl")}
                    onVerificationComplete={handleVerificationComplete}
                    onCanMintNFT={handleCanMintNFT}
                  />
                )}

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    disabled={!canMintNFT && selectedVideos.length === 0}
                    className="px-8"
                  >
                    Next: Pricing
                    <DollarSign className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Pricing & Terms */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in">
                {/* Multi-video pricing for YouTube channel selection */}
                {selectedVideos.length > 0 ? (
                  <MultiVideoPricing 
                    videos={selectedVideos}
                    onPricingComplete={handlePricingComplete}
                  />
                ) : (
                  /* Single NFT pricing */
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Pricing & Revenue
                      </CardTitle>
                      <CardDescription>
                        Set your pricing strategy and revenue distribution
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Fee Information */}
                      <FeeInfo variant="detailed" className="mb-6" />
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="price"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Price *</FormLabel>
                              <FormControl>
                                <Input placeholder="0.00" value={field.value || ""} onChange={field.onChange} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="currency"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Currency</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value || undefined}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select currency" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="HBAR">HBAR</SelectItem>
                                  <SelectItem value="USD">USD</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="paysDividends"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Revenue Distribution</FormLabel>
                              <FormDescription>
                                Enable automatic revenue sharing with NFT holders
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    disabled={selectedVideos.length > 0 ? videoPricingData.length === 0 : !form.watch("price")}
                    className="px-8"
                  >
                    Review & Submit
                    <Eye className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 4: Review & Submit */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fade-in">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Review & Confirm
                    </CardTitle>
                    <CardDescription>
                      Review your submission before minting
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {selectedVideos.length > 0 ? (
                      /* Multi-video summary */
                      <div className="space-y-4">
                        <h3 className="font-medium">Creating {selectedVideos.length} NFTs</h3>
                        <div className="grid gap-3">
                          {selectedVideos.slice(0, 3).map((video, index) => {
                            const pricing = videoPricingData.find(p => p.videoId === video.id);
                            return (
                              <div key={video.id} className="flex items-center gap-3 p-3 border rounded">
                                <img src={video.thumbnails.medium.url} alt="" className="w-16 h-12 object-cover rounded" />
                                <div className="flex-1">
                                  <p className="font-medium text-sm">{video.title}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {pricing?.listingType === 'auction' ? 'Auction' : 'Fixed Price'}: {pricing?.price} {pricing?.currency}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                          {selectedVideos.length > 3 && (
                            <p className="text-sm text-muted-foreground">+ {selectedVideos.length - 3} more videos</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Single NFT summary */
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium mb-3">Right Details</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Type:</span>
                              <span className="capitalize">{form.watch("type")}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Title:</span>
                              <span>{form.watch("title")}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Price:</span>
                              <span>{form.watch("price")} {form.watch("currency")}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-3">Verification Status</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant={canMintNFT ? "default" : "secondary"}>
                              {canMintNFT ? "Verified" : "Pending"}
                            </Badge>
                            {canMintNFT && <Check className="w-4 h-4 text-green-600" />}
                          </div>
                        </div>
                      </div>
                    )}

                    {isUploading && (
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Creating NFT{selectedVideos.length > 1 ? 's' : ''}...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="w-full" />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(3)}
                    disabled={isUploading}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUploading || !canMintNFT}
                    className="px-8"
                  >
                    {isUploading ? 'Creating...' : `Create NFT${selectedVideos.length > 1 ? 's' : ''}`}
                    <Zap className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}