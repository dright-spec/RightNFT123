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
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { uploadContentToIPFS, generateFileHash } from "@/lib/ipfs";
import { Upload, FileText, Loader2, Music, Video, Image, File, AlertCircle, Clock, Gavel } from "lucide-react";
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
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    try {
      // Generate a hash from the YouTube URL for content verification
      const blob = new Blob([youtubeUrl], { type: 'text/plain' });
      const urlFile = new File([blob], `youtube-${videoId}.txt`, { type: 'text/plain' });
      const urlHash = await generateFileHash(urlFile);
      
      toast({
        title: "YouTube Video Added",
        description: "Video URL has been processed and ready for verification",
      });
      
      setSelectedFile(null); // Clear file if YouTube URL is used
    } catch (error) {
      toast({
        title: "Processing Failed",
        description: "Failed to process YouTube URL. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create a New Right</DialogTitle>
        </DialogHeader>

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
