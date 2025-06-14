import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { VerificationStatusBadge } from "@/components/verification-status-badge";
import { FileUploadValidator } from "@/components/file-upload-validator";
import { YouTubeVerificationWizard } from "@/components/youtube-verification-wizard";
import { YouTubeChannelPicker } from "@/components/youtube-channel-picker";
import { CheckCircle, Clock, AlertTriangle, FileText, Youtube, Shield, Zap } from "lucide-react";

interface VerificationWorkflowProps {
  rightType: string;
  initialYouTubeUrl?: string;
  onVerificationComplete: (verificationData: VerificationData) => void;
  onCanMintNFT: (canMint: boolean) => void;
}

interface VerificationData {
  method: 'youtube' | 'manual' | 'hybrid';
  status: 'pending' | 'verified' | 'rejected' | 'incomplete';
  files: any[];
  youtubeData?: any;
  adminNotes?: string;
  verifiedAt?: Date;
}

export function VerificationWorkflow({ rightType, initialYouTubeUrl, onVerificationComplete, onCanMintNFT }: VerificationWorkflowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [verificationMethod, setVerificationMethod] = useState<'youtube' | 'manual' | 'hybrid'>(() => {
    // Auto-select YouTube verification if URL is provided
    return initialYouTubeUrl && initialYouTubeUrl.trim() ? 'youtube' : 'manual';
  });
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [youtubeVerification, setYoutubeVerification] = useState<any>(null);
  const [verificationStatus, setVerificationStatus] = useState<'incomplete' | 'pending' | 'verified' | 'rejected'>('incomplete');
  const [canProceedToMint, setCanProceedToMint] = useState(false);

  // Auto-advance to step 2 if YouTube URL is provided
  useEffect(() => {
    if (initialYouTubeUrl && initialYouTubeUrl.trim()) {
      setCurrentStep(2);
    }
  }, [initialYouTubeUrl]);

  // Track verification state to prevent loops
  const lastVerificationState = useRef<string>('');

  // Check if verification is complete and user can mint NFT
  useEffect(() => {
    const hasRequiredFiles = uploadedFiles.length > 0;
    const isYouTubeFullyVerified = youtubeVerification?.success && youtubeVerification?.details?.ownershipConfirmed;
    const isVerified = verificationStatus === 'verified';
    
    const canMint = isYouTubeFullyVerified || (hasRequiredFiles && isVerified);
    setCanProceedToMint(canMint);

    // Create a state signature to detect actual changes
    const currentState = `${uploadedFiles.length}-${isYouTubeFullyVerified}-${verificationStatus}`;
    
    // Only update parent if state actually changed
    if (currentState !== lastVerificationState.current && (hasRequiredFiles || isYouTubeFullyVerified)) {
      const verificationData: VerificationData = {
        method: isYouTubeFullyVerified ? 'youtube' : 'manual',
        status: isYouTubeFullyVerified ? 'verified' : (hasRequiredFiles ? 'pending' : 'incomplete'),
        files: uploadedFiles,
        youtubeData: youtubeVerification,
        verifiedAt: isYouTubeFullyVerified ? new Date() : undefined
      };
      
      onVerificationComplete(verificationData);
      onCanMintNFT(canMint);
      lastVerificationState.current = currentState;
    }
  }, [uploadedFiles.length, youtubeVerification?.success, youtubeVerification?.details?.ownershipConfirmed, verificationStatus]);

  const handleYouTubeVerification = (videoDetails: any) => {
    setYoutubeVerification({ success: true, details: videoDetails });
    setVerificationMethod('youtube');
    
    // Only mark as verified and advance if ownership is confirmed
    if (videoDetails.ownershipConfirmed) {
      setVerificationStatus('verified');
      setCurrentStep(3); // Skip to final step
    }
  };

  const handleFilesValidated = (files: any[]) => {
    setUploadedFiles(files);
    if (files.length > 0) {
      setVerificationStatus('pending');
    }
  };

  const getStepStatus = (step: number) => {
    if (step < currentStep) return 'completed';
    if (step === currentStep) return 'current';
    return 'upcoming';
  };

  const getVerificationProgress = () => {
    if (youtubeVerification?.success && youtubeVerification?.details?.ownershipConfirmed) return 100;
    if (uploadedFiles.length > 0 && verificationStatus === 'verified') return 100;
    if (uploadedFiles.length > 0) return 75;
    if (currentStep >= 2) return 50;
    return 25;
  };

  const steps = [
    {
      id: 1,
      title: "Choose Verification Method",
      description: "Select how you want to verify ownership"
    },
    {
      id: 2,
      title: "Upload & Verify",
      description: "Provide verification materials"
    },
    {
      id: 3,
      title: "Review & Mint",
      description: "Complete verification and mint NFT"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Verification Workflow
          </CardTitle>
          <CardDescription>
            Complete verification to mint your NFT on Hedera blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Verification Progress</span>
                <span>{getVerificationProgress()}%</span>
              </div>
              <Progress value={getVerificationProgress()} className="h-2" />
            </div>

            {/* Current Status */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Current Status:</span>
              <VerificationStatusBadge 
                status={verificationStatus}
                hasFiles={uploadedFiles.length > 0}
                isYouTubeVerified={youtubeVerification?.success}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steps Navigation */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => {
          const status = getStepStatus(step.id);
          return (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                status === 'completed' ? 'bg-green-600 border-green-600 text-white' :
                status === 'current' ? 'bg-primary border-primary text-primary-foreground' :
                'border-muted-foreground text-muted-foreground'
              }`}>
                {status === 'completed' ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-2 ${
                  status === 'completed' ? 'bg-green-600' : 'bg-muted'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Choose Your Verification Method</CardTitle>
              <CardDescription>
                Select the best way to verify ownership of your content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                {/* YouTube Verification Option */}
                <div 
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    verificationMethod === 'youtube' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/50'
                  }`}
                  onClick={() => setVerificationMethod('youtube')}
                >
                  <div className="flex items-start gap-3">
                    <Youtube className="w-6 h-6 text-red-500 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">YouTube Auto-Verification</h3>
                        <Badge className="bg-green-100 text-green-800 border-green-300">
                          <Zap className="w-3 h-3 mr-1" />
                          Instant
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        <strong>Perfect for YouTube videos!</strong> Connect your Google account to automatically verify you own the video. Your NFT will be ready to mint immediately.
                      </p>
                      <div className="bg-green-50 p-3 rounded-md mb-3">
                        <p className="text-xs text-green-800 font-medium mb-2">How YouTube verification works:</p>
                        <ol className="text-xs text-green-700 space-y-1 list-decimal list-inside">
                          <li>Paste your YouTube video URL</li>
                          <li>Sign in with your Google account</li>
                          <li>We verify you own the channel</li>
                          <li>Instant approval - mint your NFT right away!</li>
                        </ol>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-green-700">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Instant approval
                        </span>
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          100% secure
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          No waiting
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Manual Verification Option */}
                <div 
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    verificationMethod === 'manual' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/50'
                  }`}
                  onClick={() => setVerificationMethod('manual')}
                >
                  <div className="flex items-start gap-3">
                    <FileText className="w-6 h-6 text-blue-500 mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium">Document Verification</h3>
                        <Badge variant="outline">1-3 Days</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        <strong>For all other content types:</strong> Music, images, documents, patents, trademarks, and more. Upload legal documents proving ownership for expert review.
                      </p>
                      <div className="bg-blue-50 p-3 rounded-md mb-3">
                        <p className="text-xs text-blue-800 font-medium mb-2">Document verification process:</p>
                        <ol className="text-xs text-blue-700 space-y-1 list-decimal list-inside">
                          <li>Upload ownership certificates, contracts, or legal docs</li>
                          <li>Our verification experts review your submission</li>
                          <li>Additional documents may be requested if needed</li>
                          <li>Approval typically takes 24-48 hours</li>
                          <li>Once approved, your NFT is ready to mint</li>
                        </ol>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-blue-700">
                        <span className="flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          Expert review
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          24-48 hours
                        </span>
                        <span className="flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Legal compliance
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Button 
                onClick={() => setCurrentStep(2)}
                className="w-full"
                disabled={!verificationMethod}
              >
                Continue with {verificationMethod === 'youtube' ? 'YouTube' : 'Document'} Verification
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-6">
          {verificationMethod === 'youtube' ? (
            <YouTubeChannelPicker
              rightType={rightType}
              onVideoSelect={handleYouTubeVerification}
            />
          ) : (
            <FileUploadValidator
              rightType={rightType}
              onFilesValidated={handleFilesValidated}
              required={true}
            />
          )}

          {/* Navigation */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              Back
            </Button>
            {uploadedFiles.length > 0 && (
              <Button onClick={() => setCurrentStep(3)}>
                Continue to Review
              </Button>
            )}
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Verification Summary</CardTitle>
              <CardDescription>
                Review your verification status before proceeding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Verification Method */}
              <div className="flex items-center justify-between">
                <span className="font-medium">Verification Method:</span>
                <Badge variant="outline">
                  {verificationMethod === 'youtube' ? 'YouTube Auto-Verification' : 'Document Review'}
                </Badge>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="font-medium">Status:</span>
                <VerificationStatusBadge 
                  status={verificationStatus}
                  hasFiles={uploadedFiles.length > 0}
                  isYouTubeVerified={youtubeVerification?.success}
                />
              </div>

              {/* Files Uploaded */}
              <div className="flex items-center justify-between">
                <span className="font-medium">Files Uploaded:</span>
                <span className="text-sm">{uploadedFiles.length} file(s)</span>
              </div>

              {/* YouTube Details */}
              {youtubeVerification?.success && (
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">YouTube Verification Confirmed</h4>
                  <div className="text-sm text-green-700 space-y-1">
                    <p><strong>Video:</strong> {youtubeVerification.details?.title}</p>
                    <p><strong>Channel:</strong> {youtubeVerification.details?.channelTitle}</p>
                  </div>
                </div>
              )}

              {/* Pending Review Notice */}
              {verificationStatus === 'pending' && !youtubeVerification?.success && (
                <Alert>
                  <Clock className="w-4 h-4" />
                  <AlertDescription>
                    Your documents are under review. You'll receive notification once verification is complete (typically 1-3 business days).
                  </AlertDescription>
                </Alert>
              )}

              {/* Ready to Mint */}
              {canProceedToMint && (
                <Alert>
                  <CheckCircle className="w-4 h-4" />
                  <AlertDescription>
                    Verification complete! You can now proceed to mint your NFT.
                  </AlertDescription>
                </Alert>
              )}

              {/* Cannot Mint Yet */}
              {!canProceedToMint && verificationStatus !== 'pending' && (
                <Alert variant="destructive">
                  <AlertTriangle className="w-4 h-4" />
                  <AlertDescription>
                    Verification required before NFT minting. Please complete the verification process.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              Back to Upload
            </Button>
            {!canProceedToMint && verificationStatus === 'incomplete' && (
              <Button onClick={() => setCurrentStep(2)}>
                Complete Verification
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}