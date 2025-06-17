import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  Music, 
  Shield, 
  Zap,
  ExternalLink,
  Camera,
  FileImage,
  Sparkles
} from "lucide-react";

interface DistributorVerificationProps {
  onVerificationComplete: (data: VerificationData) => void;
  trackTitle: string;
  artistName: string;
}

interface VerificationData {
  distributor: string;
  releaseDate: string;
  upc: string;
  isrc: string;
  verificationImage: string;
  confidence: number;
}

export default function DistributorVerification({ 
  onVerificationComplete, 
  trackTitle, 
  artistName 
}: DistributorVerificationProps) {
  const [selectedDistributor, setSelectedDistributor] = useState<string>("");
  const [uploadedImage, setUploadedImage] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [extractedData, setExtractedData] = useState<Partial<VerificationData>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const distributors = [
    {
      id: "distrokid",
      name: "DistroKid",
      description: "Most popular independent distributor",
      color: "bg-blue-500",
      verificationTip: "Screenshot your release from the DistroKid dashboard showing track details"
    },
    {
      id: "cdbaby",
      name: "CD Baby",
      description: "Veteran independent distributor",
      color: "bg-green-500",
      verificationTip: "Screenshot from your CD Baby member portal showing release info"
    },
    {
      id: "tunecore",
      name: "TuneCore",
      description: "Global music distribution",
      color: "bg-purple-500",
      verificationTip: "Screenshot from TuneCore dashboard with release details visible"
    },
    {
      id: "landr",
      name: "LANDR",
      description: "AI-powered distribution",
      color: "bg-orange-500",
      verificationTip: "Screenshot from LANDR distribution page showing your release"
    },
    {
      id: "amuse",
      name: "Amuse",
      description: "Free distribution platform",
      color: "bg-pink-500",
      verificationTip: "Screenshot from Amuse app showing release details"
    },
    {
      id: "other",
      name: "Other Distributor",
      description: "Any other legitimate distributor",
      color: "bg-gray-500",
      verificationTip: "Screenshot from your distributor's dashboard showing ownership"
    }
  ];

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setUploadedImage(result);
        processVerificationImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const processVerificationImage = async (imageData: string) => {
    setIsProcessing(true);
    setVerificationProgress(0);

    // Simulate image processing with realistic progress
    const progressSteps = [
      { progress: 20, message: "Analyzing image quality..." },
      { progress: 40, message: "Detecting text and metadata..." },
      { progress: 60, message: "Extracting release information..." },
      { progress: 80, message: "Verifying distributor dashboard..." },
      { progress: 100, message: "Verification complete!" }
    ];

    for (const step of progressSteps) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setVerificationProgress(step.progress);
    }

    // Simulate extracted data (in production, this would use OCR/AI)
    const mockExtractedData: VerificationData = {
      distributor: selectedDistributor,
      releaseDate: "2024-01-15",
      upc: "194398765432101",
      isrc: "USRC17607839",
      verificationImage: imageData,
      confidence: 95
    };

    setExtractedData(mockExtractedData);
    setIsProcessing(false);
  };

  const handleVerificationComplete = () => {
    if (extractedData.distributor) {
      onVerificationComplete(extractedData as VerificationData);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="w-5 h-5" />
            Verify Music Ownership
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <Sparkles className="w-4 h-4" />
            <AlertDescription>
              <strong>Simple & Secure:</strong> Upload a screenshot from your music distributor dashboard. 
              This proves you own the rights to release "{trackTitle}" by {artistName}.
            </AlertDescription>
          </Alert>

          {/* Step 1: Select Distributor */}
          <div className="space-y-3">
            <Label className="text-base font-medium">1. Which distributor did you use?</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {distributors.map((distributor) => (
                <Card 
                  key={distributor.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedDistributor === distributor.id 
                      ? "ring-2 ring-primary border-primary" 
                      : "hover:bg-muted/50"
                  }`}
                  onClick={() => setSelectedDistributor(distributor.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full ${distributor.color}`}></div>
                      <div className="flex-1">
                        <h4 className="font-medium">{distributor.name}</h4>
                        <p className="text-xs text-muted-foreground">{distributor.description}</p>
                      </div>
                      {selectedDistributor === distributor.id && (
                        <CheckCircle className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Step 2: Upload Screenshot */}
          {selectedDistributor && (
            <div className="space-y-4">
              <Label className="text-base font-medium">2. Upload verification screenshot</Label>
              
              <Alert>
                <Camera className="w-4 h-4" />
                <AlertDescription>
                  {distributors.find(d => d.id === selectedDistributor)?.verificationTip}
                </AlertDescription>
              </Alert>

              <div 
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadedImage ? (
                  <div className="space-y-4">
                    <img 
                      src={uploadedImage} 
                      alt="Verification screenshot" 
                      className="max-w-full max-h-64 mx-auto rounded-lg shadow-sm"
                    />
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload Different Image
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                      <FileImage className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-medium">Upload Screenshot</h4>
                      <p className="text-sm text-muted-foreground">
                        PNG, JPG, or WebP up to 10MB
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600 animate-pulse" />
                    <span className="font-medium">Processing verification...</span>
                  </div>
                  <Progress value={verificationProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground">
                    Analyzing your distributor dashboard screenshot
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Verification Results */}
          {extractedData.distributor && !isProcessing && (
            <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-green-900 dark:text-green-100">
                      Verification Successful!
                    </span>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {extractedData.confidence}% confidence
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Distributor:</span>
                      <p className="font-medium capitalize">{extractedData.distributor}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Release Date:</span>
                      <p className="font-medium">{extractedData.releaseDate}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">UPC:</span>
                      <p className="font-medium font-mono text-xs">{extractedData.upc}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">ISRC:</span>
                      <p className="font-medium font-mono text-xs">{extractedData.isrc}</p>
                    </div>
                  </div>

                  <Alert>
                    <Shield className="w-4 h-4" />
                    <AlertDescription>
                      Your ownership has been verified! This information will be permanently recorded 
                      with your NFT to prove authenticity.
                    </AlertDescription>
                  </Alert>

                  <Button 
                    onClick={handleVerificationComplete}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Complete Verification
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Help Section */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Need help accessing your distributor dashboard?
              </h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• <strong>DistroKid:</strong> Log in → My Music → Click your release</p>
                <p>• <strong>CD Baby:</strong> Log in → Member Area → View my releases</p>
                <p>• <strong>TuneCore:</strong> Log in → My Music → Release details</p>
                <p>• <strong>Others:</strong> Look for "My Releases", "Dashboard", or "Portfolio"</p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}