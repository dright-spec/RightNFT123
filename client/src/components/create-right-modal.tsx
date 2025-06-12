import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { uploadContentToIPFS, uploadToIPFS, uploadJSONToIPFS, generateFileHash } from "@/lib/ipfs";
import { initiateGoogleAuth, extractYouTubeVideoId, getYouTubeVideoDetails } from "@/lib/googleAuth";
import { Upload, FileText, Loader2, Music, Video, Image, File, AlertCircle, Clock, Gavel, CheckCircle, Shield, Youtube, ArrowRight, ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { InsertRight } from "@shared/schema";

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  type: z.enum(["copyright", "royalty", "access", "ownership", "license"]),
  description: z.string().min(10, "Description must be at least 10 characters"),
  tags: z.array(z.string()).default([]),
  listingType: z.enum(["fixed", "auction"]).default("fixed"),
  price: z.string().min(1, "Price is required"),
  currency: z.string().default("ETH"),
  auctionDuration: z.number().optional(),
  minBidAmount: z.string().optional(),
  paysDividends: z.boolean().default(false),
  paymentAddress: z.string().optional(),
  paymentFrequency: z.enum(["monthly", "quarterly", "yearly", "streaming"]).optional(),
  revenueDistributionMethod: z.enum(["automatic", "manual", "escrow"]).optional(),
  distributionPercentage: z.string().optional(),
  minimumDistribution: z.string().optional(),
  distributionDetails: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface CreateRightModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const rightTypeOptions = [
  { value: "copyright", label: "📄 Copyright (Music, Media)", symbol: "📄" },
  { value: "royalty", label: "💰 Revenue Share", symbol: "💰" },
  { value: "license", label: "📜 License (Patent, Trademark)", symbol: "📜" },
  { value: "ownership", label: "🏢 Ownership Rights", symbol: "🏢" },
  { value: "access", label: "🔐 Access Rights", symbol: "🔐" },
];

export function CreateRightModal({ open, onOpenChange }: CreateRightModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [ownershipFiles, setOwnershipFiles] = useState<File[]>([]);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isVerifyingGoogle, setIsVerifyingGoogle] = useState(false);
  const [googleVerificationResult, setGoogleVerificationResult] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [videoDetails, setVideoDetails] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ownershipInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: "copyright",
      description: "",
      tags: [],
      listingType: "fixed",
      price: "",
      currency: "ETH",
      paysDividends: false,
      paymentAddress: "",
      paymentFrequency: "monthly",
      revenueDistributionMethod: "automatic",
      distributionPercentage: "",
      minimumDistribution: "",
      distributionDetails: "",
    },
  });

  const paysDividends = form.watch("paysDividends");
  const selectedType = form.watch("type");
  const listingType = form.watch("listingType");

  const createRightMutation = useMutation({
    mutationFn: async (data: InsertRight) => {
      const response = await apiRequest("POST", "/api/rights", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rights"] });
      toast({
        title: "Right Created Successfully!",
        description: "Your right has been minted as an NFT and is now available.",
      });
      onOpenChange(false);
      form.reset();
      setSelectedFile(null);
      setOwnershipFiles([]);
      setYoutubeUrl("");
    },
    onError: (error) => {
      toast({
        title: "Failed to Create Right",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = [
        'audio/', 'video/', 'image/',
        'application/pdf'
      ];
      
      const isValidType = validTypes.some(type => file.type.startsWith(type));
      
      if (isValidType) {
        setSelectedFile(file);
        setYoutubeUrl(""); // Clear YouTube URL if file is selected
      } else {
        toast({
          title: "Invalid File Type",
          description: "Please select an audio, video, image, or PDF file",
          variant: "destructive",
        });
      }
    }
  };

  const extractYouTubeVideoId = (url: string): string | null => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/watch\?.*v=([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleYoutubeUrl = async () => {
    if (!youtubeUrl) return;
    
    const videoId = extractYouTubeVideoId(youtubeUrl);
    if (!videoId) {
      toast({
        title: "Invalid YouTube URL",
        description: "Please enter a valid YouTube URL",
        variant: "destructive",
      });
      return;
    }

    setIsExtracting(true);
    setProgressMessage("Fetching video information...");
    setUploadProgress(20);
    
    try {
      // Fetch video details from YouTube API
      console.log('Fetching video details for:', videoId);
      
      // Create a simple fetch function to avoid import issues
      const response = await fetch(`/api/youtube/video/${videoId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch video details: ${response.status}`);
      }
      
      const fetchedVideoDetails = await response.json();
      console.log('Video details fetched:', fetchedVideoDetails);
      
      setProgressMessage("Processing video data...");
      setUploadProgress(60);
      
      // Store video details for later use
      setVideoDetails(fetchedVideoDetails);
      
      // Auto-fill form fields with video data
      form.setValue("title", fetchedVideoDetails.title);
      if (!form.getValues("description")) {
        form.setValue("description", `YouTube video: ${fetchedVideoDetails.title} by ${fetchedVideoDetails.channelTitle}`);
      }
      
      setProgressMessage("Generating content hash...");
      setUploadProgress(80);
      
      // Generate a hash from the YouTube URL for content verification
      const encoder = new TextEncoder();
      const data = encoder.encode(youtubeUrl);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const urlHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      
      setProgressMessage("Complete!");
      setUploadProgress(100);
      
      // Auto-advance to verification step with Google OAuth prompt
      setSelectedFile(null); // Clear file if YouTube URL is used
      setCurrentStep(2); // Move to verification step
      
      // Show success with next step guidance
      toast({
        title: "Video Details Loaded Successfully",
        description: `"${fetchedVideoDetails.title}" is ready. Now verify your ownership to build trust with buyers.`,
      });
      
      // Auto-prompt for Google verification after a brief delay
      setTimeout(() => {
        handleGoogleVerification();
      }, 1500);
    } catch (error) {
      console.error('YouTube processing error:', error);
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process YouTube URL. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
      setTimeout(() => {
        setUploadProgress(0);
        setProgressMessage("");
      }, 2000);
    }
  };

  const handleOwnershipFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      setOwnershipFiles(prev => [...prev, ...files]);
      toast({
        title: "Documents Added",
        description: `${files.length} ownership document(s) added for verification`,
      });
    }
    // Reset input value to allow selecting the same file again
    event.target.value = "";
  };

  const removeOwnershipFile = (index: number) => {
    setOwnershipFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleGoogleVerification = async () => {
    try {
      setIsVerifyingGoogle(true);
      setProgressMessage("Connecting to Google...");
      setUploadProgress(20);
      
      // Extract video ID from YouTube URL
      const videoId = youtubeUrl ? extractYouTubeVideoId(youtubeUrl) : null;
      
      if (!videoId) {
        toast({
          title: "YouTube URL Required",
          description: "Please enter a valid YouTube video URL first.",
          variant: "destructive",
        });
        setIsVerifyingGoogle(false);
        setProgressMessage("");
        setUploadProgress(0);
        return;
      }

      setProgressMessage("Opening Google authentication...");
      setUploadProgress(40);

      // Redirect to Google OAuth instead of popup
      const clientIdResponse = await fetch('/api/auth/google/client-id');
      const { clientId } = await clientIdResponse.json();
      
      if (!clientId) {
        throw new Error('Google Client ID not available');
      }

      setProgressMessage("Redirecting to Google...");
      setUploadProgress(60);
      
      // Store current state before redirect
      localStorage.setItem('youtube_verification_state', JSON.stringify({
        videoId,
        videoDetails,
        currentStep: 2,
        rightFormData: form.getValues()
      }));
      
      // Build OAuth URL for redirect flow
      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: `${window.location.origin}/auth/google/callback`,
        response_type: 'code',
        scope: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        access_type: 'offline',
        prompt: 'consent',
        state: 'youtube_verification'
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
      
      toast({
        title: "Redirecting to Google",
        description: "You'll be redirected to Google to verify your YouTube channel ownership.",
      });
      
      // Redirect to Google OAuth
      window.location.href = authUrl;
      
    } catch (error) {
      console.error("Google verification error:", error);
      toast({
        title: "Verification Failed",
        description: error instanceof Error ? error.message : "Google verification failed. Please try again.",
        variant: "destructive",
      });
      setIsVerifyingGoogle(false);
      setProgressMessage("");
      setUploadProgress(0);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsUploading(true);
    
    try {
      let contentFileHash = "";
      let contentFileUrl = "";
      let contentFileName = "";
      let contentFileSize = 0;
      let contentFileType = "";

      // Upload content file or process YouTube URL
      if (selectedFile) {
        const uploadResult = await uploadContentToIPFS(selectedFile);
        if (uploadResult.success) {
          contentFileHash = uploadResult.fileHash || "";
          contentFileUrl = uploadResult.url;
          contentFileName = uploadResult.fileName || selectedFile.name;
          contentFileSize = uploadResult.fileSize || selectedFile.size;
          contentFileType = uploadResult.fileType || selectedFile.type;
        } else {
          throw new Error("Failed to upload content file");
        }
      } else if (youtubeUrl) {
        // Process YouTube URL
        const videoId = extractYouTubeVideoId(youtubeUrl);
        if (videoId) {
          // Create a File object for YouTube URL hashing
          const blob = new Blob([youtubeUrl], { type: 'text/plain' });
          const urlFile = new File([blob], `youtube-${videoId}.txt`, { type: 'text/plain' });
          contentFileHash = await generateFileHash(urlFile);
          contentFileUrl = youtubeUrl;
          contentFileName = `YouTube Video: ${videoId}`;
          contentFileType = "video/youtube";
        } else {
          throw new Error("Invalid YouTube URL");
        }
      }

      // Generate symbol from title
      const symbol = data.title.substring(0, 6).toUpperCase().replace(/[^A-Z]/g, '') || "DRIGHT";

      const rightData: InsertRight = {
        title: data.title,
        type: data.type,
        description: data.description,
        symbol,
        tags: data.tags,
        listingType: data.listingType,
        price: data.price,
        currency: data.currency,
        auctionEndTime: data.listingType === "auction" && data.auctionDuration 
          ? new Date(Date.now() + data.auctionDuration * 60 * 60 * 1000) 
          : undefined,
        minBidAmount: data.minBidAmount,
        paysDividends: data.paysDividends,
        paymentAddress: data.paysDividends ? data.paymentAddress : undefined,
        paymentFrequency: data.paysDividends ? data.paymentFrequency : undefined,
        revenueDistributionMethod: data.paysDividends ? data.revenueDistributionMethod : undefined,
        distributionPercentage: data.distributionPercentage,
        minimumDistribution: data.minimumDistribution,
        distributionDetails: data.paysDividends ? data.distributionDetails : undefined,
        contentFileHash,
        contentFileUrl,
        contentFileName,
        contentFileSize,
        contentFileType,
      };

      // Upload ownership documents to IPFS if any
      if (ownershipFiles.length > 0) {
        try {
          const ownershipDocuments = [];
          for (const file of ownershipFiles) {
            const uploadResult = await uploadToIPFS(file);
            if (uploadResult.success) {
              ownershipDocuments.push({
                name: file.name,
                hash: uploadResult.hash,
                url: uploadResult.url,
                size: file.size,
                type: file.type
              });
            }
          }
          
          if (ownershipDocuments.length > 0) {
            // Store as JSON metadata
            const ownershipMetadata = {
              documents: ownershipDocuments,
              uploadedAt: new Date().toISOString(),
              totalDocuments: ownershipDocuments.length
            };
            
            const metadataUpload = await uploadJSONToIPFS(ownershipMetadata);
            if (metadataUpload.success) {
              rightData.ownershipDocumentHash = metadataUpload.hash;
              rightData.ownershipDocumentUrl = metadataUpload.url;
            }
          }
        } catch (error) {
          console.error("Error uploading ownership documents:", error);
          toast({
            title: "Warning",
            description: "Some ownership documents failed to upload, but the right will still be created.",
            variant: "destructive",
          });
        }
      };

      await createRightMutation.mutateAsync(rightData);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : "Failed to create right",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const steps = [
    { number: 1, title: "Content & Details", description: "Add your content and basic information" },
    { number: 2, title: "Verification", description: "Verify ownership and authenticity" },
    { number: 3, title: "Pricing & Terms", description: "Set pricing and payment terms" },
    { number: 4, title: "Review & Submit", description: "Review and publish your right" }
  ];

  const resetForm = () => {
    form.reset();
    setSelectedFile(null);
    setOwnershipFiles([]);
    setYoutubeUrl("");
    setVideoDetails(null);
    setGoogleVerificationResult(null);
    setCurrentStep(1);
    setUploadProgress(0);
    setProgressMessage("");
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetForm();
      onOpenChange(newOpen);
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Shield className="h-6 w-6" />
            Create a New Right
          </DialogTitle>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6 px-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                currentStep >= step.number 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'border-gray-300 text-gray-500'
              }`}>
                {currentStep > step.number ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <span className="font-semibold">{step.number}</span>
                )}
              </div>
              <div className="ml-3 text-left">
                <div className={`text-sm font-medium ${
                  currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </div>
                <div className="text-xs text-gray-400">
                  {step.description}
                </div>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="h-4 w-4 text-gray-300 mx-4" />
              )}
            </div>
          ))}
        </div>

        {/* Progress Bar */}
        {(uploadProgress > 0 || progressMessage) && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{progressMessage}</span>
              <span className="text-sm text-gray-500">{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Right Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Streaming Rights: 'Midnight Dreams' or Patent License: AI Algorithm" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type of Right *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {rightTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      placeholder="Describe what this right allows, revenue potential, usage statistics, or market value..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content File Upload Section */}
            <Card className="border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    {selectedFile ? (
                      selectedFile.type.startsWith('audio/') ? <Music className="h-12 w-12 text-primary" /> :
                      selectedFile.type.startsWith('video/') ? <Video className="h-12 w-12 text-primary" /> :
                      selectedFile.type.startsWith('image/') ? <Image className="h-12 w-12 text-primary" /> :
                      <File className="h-12 w-12 text-primary" />
                    ) : (
                      <Upload className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  
                  {selectedFile ? (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {selectedFile.type}
                      </p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedFile(null)}
                      >
                        Remove File
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <h3 className="font-semibold">Upload Content File</h3>
                      <p className="text-sm text-muted-foreground">
                        Upload the actual content (song, video, document) to verify authenticity
                      </p>
                      <Input
                        type="file"
                        accept="audio/*,video/*,image/*,.pdf,.doc,.docx"
                        onChange={handleFileSelect}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground">
                        Supports: MP3, MP4, PDF, images • Max 100MB • Files are hashed for authenticity
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Listing Type Selection */}
            <FormField
              control={form.control}
              name="listingType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Listing Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="fixed">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Fixed Price Sale
                        </div>
                      </SelectItem>
                      <SelectItem value="auction">
                        <div className="flex items-center gap-2">
                          <Gavel className="h-4 w-4" />
                          Timed Auction
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Price and Currency for Fixed Price or Auction Settings */}
            {listingType === "fixed" ? (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price *</FormLabel>
                      <FormControl>
                        <Input placeholder="0.00" type="number" step="0.01" {...field} />
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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ETH">ETH</SelectItem>
                          <SelectItem value="USDC">USDC</SelectItem>
                          <SelectItem value="DAI">DAI</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minBidAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Starting Bid *</FormLabel>
                      <FormControl>
                        <Input placeholder="0.00" type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="auctionDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (hours) *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="24" 
                          type="number" 
                          min="1" 
                          max="168" 
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <FormField
                  control={form.control}
                  name="paysDividends"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>This right generates ongoing revenue</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Enable if this right pays dividends, royalties, or recurring income to holders
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {paysDividends && (
                  <div className="mt-4 space-y-4">
                    <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                            Revenue Distribution Transparency Required
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            You must clearly specify how ongoing revenue will be distributed to NFT holders to ensure transparency and trust.
                          </p>
                        </div>
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="revenueDistributionMethod"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Revenue Distribution Method *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select distribution method" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="equal">Equal Split Among All Holders</SelectItem>
                              <SelectItem value="proportional">Proportional to Ownership Percentage</SelectItem>
                              <SelectItem value="tiered">Tiered Based on Purchase Price</SelectItem>
                              <SelectItem value="custom">Custom Distribution Formula</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="distributionPercentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Revenue Share % *</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="e.g., 80" 
                                type="number" 
                                min="1" 
                                max="100" 
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                              />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                              Percentage of revenue shared with NFT holders
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="minimumDistribution"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minimum Distribution</FormLabel>
                            <FormControl>
                              <Input placeholder="0.001" type="number" step="0.001" {...field} />
                            </FormControl>
                            <p className="text-xs text-muted-foreground">
                              Minimum amount before distribution (ETH)
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="paymentFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Frequency *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                              <SelectItem value="streaming">Real-time Streaming</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="distributionDetails"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Distribution Details *</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Explain how revenue is generated, when distributions occur, any conditions or restrictions, and how holders can claim their payments..."
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Provide clear, transparent information about revenue distribution to build trust with potential buyers
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Contract Address</FormLabel>
                          <FormControl>
                            <Input placeholder="0x... (smart contract for automated distributions)" {...field} />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Optional: Smart contract address for automated revenue distribution
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Content Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Content Upload
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Upload your actual content files (songs, videos) or provide YouTube URL for verification and authenticity
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {/* File Upload Option */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Upload Content File</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center space-y-3">
                      {selectedFile ? (
                        <div className="space-y-2">
                          <div className="flex items-center justify-center gap-2 text-green-600">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-medium">File Selected</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedFile(null)}
                          >
                            Remove File
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                          <div>
                            <p className="font-medium">Drop your content file here</p>
                            <p className="text-sm text-muted-foreground">
                              Songs, videos, documents (MP3, MP4, MOV, PDF, etc.)
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            Choose File
                          </Button>
                        </div>
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="audio/*,video/*,.pdf,.doc,.docx"
                      onChange={handleFileSelect}
                    />
                  </div>

                  {/* Or Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">Or</span>
                    </div>
                  </div>

                  {/* YouTube URL Option */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">YouTube Video URL</Label>
                    <div className="space-y-3">
                      <Input
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={youtubeUrl}
                        onChange={(e) => setYoutubeUrl(e.target.value)}
                        disabled={isExtracting}
                      />
                      {youtubeUrl && extractYouTubeVideoId(youtubeUrl) && (
                        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Youtube className="h-4 w-4 text-red-500" />
                            <span className="text-sm">Video detected: {extractYouTubeVideoId(youtubeUrl)}</span>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={handleYoutubeUrl}
                            disabled={isExtracting}
                          >
                            {isExtracting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              "Process Video"
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      We'll extract and hash the video content for on-chain verification
                    </p>
                  </div>
                </div>

                {(selectedFile || youtubeUrl) && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-medium text-blue-900 dark:text-blue-100">Content Verification</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Your content will be hashed and stored on-chain for authenticity verification. 
                          This ensures buyers can verify they're purchasing genuine rights to the actual content.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ownership Documents Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Ownership Verification Documents
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Upload legal documents that prove your ownership of the rights you're tokenizing
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {/* Document Type Examples */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                    <h4 className="font-medium mb-2">Examples of Valid Ownership Documents:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Copyright certificates or registrations</li>
                      <li>• Trademark registration documents</li>
                      <li>• Patent certificates</li>
                      <li>• Contracts, licenses, or assignment agreements</li>
                      <li>• Recording contracts or distribution agreements</li>
                      <li>• Publishing agreements or songwriter splits</li>
                      <li>• Property deeds or ownership titles</li>
                      <li>• Court judgments establishing ownership</li>
                    </ul>
                  </div>

                  {/* File Upload Area */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Upload Ownership Documents</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center space-y-3">
                      <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                      <div>
                        <p className="font-medium">Upload legal documents</p>
                        <p className="text-sm text-muted-foreground">
                          PDF, DOC, DOCX, JPG, PNG files accepted
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => ownershipInputRef.current?.click()}
                      >
                        Choose Documents
                      </Button>
                    </div>
                    <input
                      ref={ownershipInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      multiple
                      onChange={handleOwnershipFileSelect}
                    />
                  </div>

                  {/* Uploaded Documents List */}
                  {ownershipFiles.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Uploaded Documents ({ownershipFiles.length})</Label>
                      <div className="space-y-2">
                        {ownershipFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-600" />
                              <div>
                                <p className="text-sm font-medium">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {(file.size / 1024 / 1024).toFixed(2)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeOwnershipFile(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Google Account Verification for YouTube */}
                  {(selectedFile?.type?.startsWith('video/') || youtubeUrl) && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                            <Shield className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-blue-900 dark:text-blue-100">Instant Video Verification</p>
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                              Verify your video ownership instantly using your Google account
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            For YouTube videos or video content, you can verify ownership automatically by:
                          </p>
                          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 ml-4">
                            <li>• Connecting your Google account</li>
                            <li>• Granting permission to verify your YouTube channel ownership</li>
                            <li>• Confirming the video is published on your verified channel</li>
                          </ul>
                        </div>

                        {googleVerificationResult ? (
                          <div className="w-full p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex items-center gap-3">
                              <CheckCircle className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="font-medium text-green-900 dark:text-green-100">Ownership Verified!</p>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                  YouTube video ownership confirmed through Google authentication
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/30"
                            onClick={handleGoogleVerification}
                            disabled={isVerifyingGoogle}
                          >
                            {isVerifyingGoogle ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                              </svg>
                            )}
                            {isVerifyingGoogle ? "Connecting to Google..." : "Verify with Google Account"}
                          </Button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Next Steps Notice */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-medium text-blue-900 dark:text-blue-100">Verification Complete</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          Your ownership verification is complete. You can now proceed to set pricing and payment terms for your right.
                        </p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <Button
                        type="button"
                        onClick={() => setCurrentStep(3)}
                        className="w-full"
                      >
                        Continue to Pricing & Terms
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={createRightMutation.isPending || isUploading}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createRightMutation.isPending || isUploading}
                className="min-w-[140px]"
              >
                {(createRightMutation.isPending || isUploading) ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isUploading ? "Uploading..." : "Creating..."}
                  </>
                ) : (
                  "Create Right (Mint NFT)"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
