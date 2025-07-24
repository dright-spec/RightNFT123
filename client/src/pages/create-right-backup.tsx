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
import { ArrowLeft, Upload, FileText, Shield, DollarSign, Eye, Check, X, Youtube, Link2, Music, Film, Image, FileVideo, Zap, Star, Crown, AlertCircle } from "lucide-react";
import { z } from "zod";

// Extended form schema for the create right page
const createRightFormSchema = insertRightSchema.extend({
  tags: z.array(z.string()).optional(),
  youtubeUrl: z.string().optional(),
  verificationMethod: z.enum(["youtube", "manual", "documents"]).optional(),
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
            const rightData = {
              title: video.title,
              description: video.description || `YouTube video: ${video.title}`,
              type: data.type,
              imageUrl: video.thumbnails.high.url,
              contentFileUrl: `https://www.youtube.com/watch?v=${video.id}`,
              tags: [video.channelTitle, 'YouTube', 'Video Content'],
              listingType: pricing.listingType,
              price: pricing.price,
              currency: pricing.currency,
              royaltyPercentage: pricing.royaltyPercentage.toString(),
              paysDividends: pricing.paysDividends,
              startingBid: pricing.startingBid,
              reservePrice: pricing.reservePrice,
              auctionDuration: pricing.auctionDuration,
              verificationStatus: 'verified', // YouTube videos are auto-verified
              isListed: true,
            };

            await createRightMutation.mutateAsync(rightData);
            setUploadProgress((i + 1) * progressIncrement);
          }
        }

        toast({
          title: `${selectedVideos.length} NFTs Created Successfully!`,
          description: `All video NFTs have been minted with ${videoPricingData.filter(p => p.listingType === 'auction').length} auctions and ${videoPricingData.filter(p => p.listingType === 'fixed').length} fixed price listings.`,
        });
      } else {
        // Single NFT creation (existing flow)
        const progressSteps = [20, 40, 60, 80, 100];
        for (const step of progressSteps) {
          setUploadProgress(step);
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        const rightData = {
          ...data,
          imageUrl: selectedFile ? URL.createObjectURL(selectedFile) : null,
          youtubeUrl: youtubeUrl || null,
          verificationStatus: verificationData?.status || "pending",
          verificationMethod: verificationData?.method || "manual",
          verificationFiles: verificationData?.files || [],
          youtubeData: verificationData?.youtubeData,
          isListed: true,
        };

        await createRightMutation.mutateAsync(rightData);
      }
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to create right",
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/")}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </div>
            
            <nav className="hidden md:flex space-x-6">
              <Link href="/marketplace" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                Marketplace
              </Link>
              <Link href="/auctions" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                Auctions
              </Link>
              <Link href="/dashboard" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                Dashboard
              </Link>
              <Link href="/docs" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                Docs
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl font-bold text-foreground mb-2">Create a New Right</h1>
          <p className="text-muted-foreground">
            Transform your creative work into a tradeable digital asset with built-in revenue distribution.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  currentStep >= step.number 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : 'border-muted-foreground text-muted-foreground'
                }`}>
                  {currentStep > step.number ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-sm font-medium">{step.number}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-2 ${
                    currentStep > step.number ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <h3 className="font-medium text-foreground">{steps[currentStep - 1]?.title}</h3>
            <p className="text-sm text-muted-foreground">{steps[currentStep - 1]?.description}</p>
          </div>
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <Card className="mb-6 animate-fade-in">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <Upload className="w-5 h-5 text-primary animate-pulse" />
                <span className="font-medium">Creating your right...</span>
              </div>
              <Progress value={uploadProgress} className="mb-2" />
              <p className="text-sm text-muted-foreground">
                {uploadProgress < 100 ? `Uploading... ${uploadProgress}%` : "Finalizing creation..."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Main Form */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Step 1: Content & Details */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in">
                {/* Right Type Selection */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Crown className="w-5 h-5" />
                      Select Right Type
                    </CardTitle>
                    <CardDescription>
                      Choose the type of legal right you want to tokenize
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {rightTypes.map((type) => (
                                <div
                                  key={type.value}
                                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                                    field.value === type.value
                                      ? 'border-primary bg-primary/5 shadow-md'
                                      : 'border-muted hover:border-muted-foreground/50'
                                  }`}
                                  onClick={() => field.onChange(type.value)}
                                >
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="text-2xl">{type.symbol}</div>
                                    <type.icon className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                  <h3 className="font-medium mb-1">{type.label}</h3>
                                  <p className="text-xs text-muted-foreground">{type.description}</p>
                                </div>
                              ))}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Basic Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter a descriptive title for your right" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description *</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Provide detailed information about your right, including what it covers and any important terms"
                              className="min-h-[120px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* YouTube URL Field */}
                    <FormField
                      control={form.control}
                      name="youtubeUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Youtube className="w-4 h-4 text-red-500" />
                            YouTube Video URL (Optional)
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <Zap className="w-3 h-3 mr-1" />
                              Instant Verification
                            </Badge>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://www.youtube.com/watch?v=..."
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription className="text-sm">
                            <div className="bg-green-50 p-3 rounded-md border border-green-200">
                              <div className="text-green-800 font-medium mb-1">Fast-track your verification!</div>
                              <div className="text-green-700 text-xs">
                                If your content is a YouTube video you own, paste the URL here for instant verification and approval. 
                                Your NFT will be ready to mint immediately after Google authentication.
                              </div>
                            </div>
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* File Upload */}
                    <div>
                      <FormLabel>Content File (Optional)</FormLabel>
                      <div className="mt-2">
                        <div
                          className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          {selectedFile ? (
                            <div className="flex items-center justify-center gap-2">
                              <FileVideo className="w-5 h-5 text-primary" />
                              <span className="text-sm font-medium">{selectedFile.name}</span>
                            </div>
                          ) : (
                            <div>
                              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                              <p className="text-sm text-muted-foreground">
                                Click to upload your content file (images, videos, audio, documents)
                              </p>
                            </div>
                          )}
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          className="hidden"
                          accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                          onChange={(e) => handleFileUpload(e, 'main')}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-end">
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    disabled={!form.watch("title") || !form.watch("description")}
                    className="px-8"
                  >
                    Next: Verification
                    <Shield className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Verification */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in">
                <VerificationWorkflow 
                  rightType={form.watch("type") || "copyright"}
                  initialYouTubeUrl={form.watch("youtubeUrl")}
                  onVerificationComplete={handleVerificationComplete}
                  onCanMintNFT={handleCanMintNFT}
                />

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
                    disabled={!canMintNFT}
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
                  <>
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
                                  <SelectItem value="ETH">ETH</SelectItem>
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
                            <FormLabel className="text-base">Revenue Sharing</FormLabel>
                            <FormDescription>
                              Enable automatic dividend payments to token holders
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {form.watch("paysDividends") && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg animate-fade-in">
                        <div className="flex items-start gap-2">
                          <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
                          <div>
                            <h4 className="font-medium text-blue-900 dark:text-blue-100">Revenue Sharing Enabled</h4>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                              Token holders will automatically receive their share of revenues generated by this right.
                              All payments are distributed transparently on the Hedera blockchain.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

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
                    disabled={!form.watch("price")}
                    className="px-8"
                  >
                    Review & Submit
                    <Eye className="w-4 h-4 ml-2" />
                  </Button>
                </div>
                </>
                )}
              </div>
            )}

            {/* Step 4: Review & Submit */}
            {currentStep === 4 && (
              <div className="space-y-6 animate-fade-in">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Review Your Right
                    </CardTitle>
                    <CardDescription>
                      Please review all details before submitting
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-2">Basic Information</h4>
                        <div className="space-y-2 text-sm">
                          <div><span className="text-muted-foreground">Type:</span> {rightTypes.find(t => t.value === form.watch("type"))?.label}</div>
                          <div><span className="text-muted-foreground">Title:</span> {form.watch("title")}</div>
                          <div><span className="text-muted-foreground">Price:</span> {form.watch("price")} {form.watch("currency")}</div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Verification Status</h4>
                        <div className="space-y-2 text-sm">
                          {youtubeUrl ? (
                            <div className="flex items-center gap-2">
                              <Check className="w-4 h-4 text-green-600" />
                              <span>YouTube verified</span>
                            </div>
                          ) : ownershipFiles.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 text-yellow-600" />
                              <span>Pending manual review</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <X className="w-4 h-4 text-red-600" />
                              <span>No verification provided</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-2">Description</h4>
                      <p className="text-sm text-muted-foreground">{form.watch("description")}</p>
                    </div>
                  </CardContent>
                </Card>

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(3)}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isUploading || !canMintNFT}
                    className="px-8 bg-gradient-to-r from-primary to-accent hover:scale-105 transition-all duration-300"
                  >
                    {isUploading ? "Creating..." : !canMintNFT ? "Complete Verification First" : "Create Right & Mint NFT"}
                    <Star className="w-4 h-4 ml-2" />
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