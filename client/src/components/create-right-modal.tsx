import { useState } from "react";
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
import { uploadToIPFS } from "@/lib/ipfs";
import { Upload, FileText, Loader2 } from "lucide-react";
import type { InsertRight } from "@shared/schema";

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  type: z.enum(["copyright", "royalty", "access", "ownership", "license"]),
  description: z.string().min(10, "Description must be at least 10 characters"),
  paysDividends: z.boolean().default(false),
  paymentAddress: z.string().optional(),
  paymentFrequency: z.enum(["monthly", "quarterly", "yearly", "streaming"]).optional(),
  price: z.string().min(1, "Price is required"),
  currency: z.string().default("ETH"),
});

type FormData = z.infer<typeof formSchema>;

interface CreateRightModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const rightTypeOptions = [
  { value: "copyright", label: "📄 Copyright", symbol: "📄" },
  { value: "royalty", label: "💰 Royalty Income", symbol: "💰" },
  { value: "access", label: "🔐 Access Right", symbol: "🔐" },
  { value: "ownership", label: "🏢 Ownership Share", symbol: "🏢" },
  { value: "license", label: "📜 License", symbol: "📜" },
];

export function CreateRightModal({ open, onOpenChange }: CreateRightModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: "copyright",
      description: "",
      paysDividends: false,
      paymentAddress: "",
      paymentFrequency: "monthly",
      price: "",
      currency: "ETH",
    },
  });

  const paysDividends = form.watch("paysDividends");
  const selectedType = form.watch("type");

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
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please select a PDF file",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsUploading(true);
    
    try {
      let legalDocumentHash = "";
      let legalDocumentUrl = "";

      // Upload legal document if provided
      if (selectedFile) {
        const uploadResult = await uploadToIPFS(selectedFile);
        legalDocumentHash = uploadResult.hash;
        legalDocumentUrl = uploadResult.url;
      }

      // Get the symbol for the selected type
      const selectedTypeOption = rightTypeOptions.find(option => option.value === data.type);
      const symbol = selectedTypeOption?.symbol || "📄";

      const rightData: InsertRight = {
        ...data,
        symbol,
        legalDocumentHash: legalDocumentHash || undefined,
        legalDocumentUrl: legalDocumentUrl || undefined,
        paymentAddress: data.paysDividends ? data.paymentAddress : undefined,
        paymentFrequency: data.paysDividends ? data.paymentFrequency : undefined,
      };

      await createRightMutation.mutateAsync(rightData);
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload legal document to IPFS",
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
                    <Input placeholder="e.g., Streaming Rights to Song XYZ" {...field} />
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
                      placeholder="Describe what this right allows or entitles..."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                        <FormLabel>This right pays dividends</FormLabel>
                        <p className="text-sm text-muted-foreground">
                          Enable if this right generates ongoing income for holders
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {paysDividends && (
                  <div className="mt-4 space-y-4">
                    <FormField
                      control={form.control}
                      name="paymentAddress"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Address</FormLabel>
                          <FormControl>
                            <Input placeholder="0x... or ENS name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="paymentFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payment Frequency</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="monthly">Monthly</SelectItem>
                              <SelectItem value="quarterly">Quarterly</SelectItem>
                              <SelectItem value="yearly">Yearly</SelectItem>
                              <SelectItem value="streaming">Streaming (Superfluid)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <div>
              <FormLabel>Legal Agreement (PDF)</FormLabel>
              <div className="mt-2">
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="legal-document"
                  />
                  <label htmlFor="legal-document" className="cursor-pointer">
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      {selectedFile ? selectedFile.name : "Drop your PDF here or click to browse"}
                    </p>
                  </label>
                </div>
                {selectedFile && (
                  <div className="mt-2">
                    <Badge variant="secondary" className="flex items-center gap-2 w-fit">
                      <FileText className="w-3 h-3" />
                      {selectedFile.name}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

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
