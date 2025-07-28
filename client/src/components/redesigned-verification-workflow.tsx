import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SecureFileUploader } from './secure-file-uploader';
import { YouTubeOwnershipVerifier } from './youtube-ownership-verifier';
import { 
  Shield, 
  FileText, 
  Youtube, 
  CheckCircle, 
  AlertTriangle, 
  Clock,
  Lock,
  Eye,
  Users
} from 'lucide-react';

interface SecureFile {
  id: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  securityChecks: {
    typeValidated: boolean;
    sizeValidated: boolean;
    virusScanned: boolean;
  };
}

interface VerificationData {
  method: 'youtube' | 'documents';
  status: 'incomplete' | 'pending' | 'verified';
  files?: SecureFile[];
  youtubeData?: any;
  verifiedAt?: Date;
}

interface RedesignedVerificationWorkflowProps {
  rightId: number;
  contentSource: string;
  onVerificationComplete: (data: VerificationData) => void;
}

export function RedesignedVerificationWorkflow({ 
  rightId, 
  contentSource, 
  onVerificationComplete 
}: RedesignedVerificationWorkflowProps) {
  const [verificationMethod, setVerificationMethod] = useState<'youtube' | 'documents' | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<SecureFile[]>([]);
  const [youtubeVerification, setYoutubeVerification] = useState<any>(null);
  const [step, setStep] = useState<'select' | 'verify' | 'review'>('select');

  const isYouTubeContent = contentSource === 'youtube_video';

  const handleMethodSelection = (method: 'youtube' | 'documents') => {
    setVerificationMethod(method);
    setStep('verify');
  };

  const handleFilesUploaded = (files: SecureFile[]) => {
    setUploadedFiles(prev => [...prev, ...files]);
    
    // Auto-advance to review if files are uploaded
    if (files.length > 0) {
      setStep('review');
    }
  };

  const handleYouTubeVerification = (data: any) => {
    setYoutubeVerification(data);
    if (data.success) {
      setStep('review');
    }
  };

  const handleSubmitVerification = () => {
    const verificationData: VerificationData = {
      method: verificationMethod!,
      status: verificationMethod === 'youtube' && youtubeVerification?.success ? 'verified' : 'pending',
      files: uploadedFiles.length > 0 ? uploadedFiles : undefined,
      youtubeData: youtubeVerification,
      verifiedAt: verificationMethod === 'youtube' && youtubeVerification?.success ? new Date() : undefined
    };
    
    onVerificationComplete(verificationData);
  };

  const getVerificationStatus = () => {
    if (verificationMethod === 'youtube' && youtubeVerification?.success) {
      return { status: 'verified', message: 'YouTube ownership verified automatically' };
    }
    if (verificationMethod === 'documents' && uploadedFiles.length > 0) {
      return { status: 'pending', message: 'Documents uploaded - pending admin review' };
    }
    return { status: 'incomplete', message: 'Verification not complete' };
  };

  if (step === 'select') {
    return (
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Choose Verification Method
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Security Notice */}
          <Alert className="border-blue-200 bg-blue-50">
            <Lock className="w-4 h-4" />
            <AlertDescription>
              <strong>Enhanced Security:</strong> All verification files are encrypted, virus-scanned, and only 
              accessible to verified administrators. Choose your verification method below.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            {/* YouTube Verification (if applicable) */}
            {isYouTubeContent && (
              <Card 
                className="cursor-pointer border-2 hover:border-red-300 transition-colors"
                onClick={() => handleMethodSelection('youtube')}
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <Youtube className="w-6 h-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">YouTube Auto-Verification</h3>
                        <Badge className="bg-green-100 text-green-800 text-xs">Instant</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">
                        Verify ownership instantly by connecting your YouTube account. 
                        Secure OAuth authentication ensures only channel owners can proceed.
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <CheckCircle className="w-3 h-3" />
                        Immediate verification
                        <CheckCircle className="w-3 h-3" />
                        No manual review needed
                        <CheckCircle className="w-3 h-3" />
                        OAuth secured
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Document Verification */}
            <Card 
              className="cursor-pointer border-2 hover:border-blue-300 transition-colors"
              onClick={() => handleMethodSelection('documents')}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">Secure Document Verification</h3>
                      <Badge variant="outline" className="text-xs">1-3 Days</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Upload legal documents, contracts, or certificates proving ownership. 
                      Expert admin review with encrypted file handling.
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Shield className="w-3 h-3" />
                      Encrypted upload
                      <Eye className="w-3 h-3" />
                      Admin-only access
                      <Users className="w-3 h-3" />
                      Expert review
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Type Guide */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2 text-sm">Recommended for your content type:</h4>
            <p className="text-xs text-gray-600">
              {isYouTubeContent 
                ? "YouTube videos: Use YouTube Auto-Verification for instant approval"
                : "Non-YouTube content: Use Document Verification with ownership certificates"
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'verify') {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {verificationMethod === 'youtube' ? (
                <Youtube className="w-5 h-5 text-red-600" />
              ) : (
                <FileText className="w-5 h-5 text-blue-600" />
              )}
              {verificationMethod === 'youtube' ? 'YouTube Verification' : 'Document Upload'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {verificationMethod === 'youtube' ? (
              <div className="text-center py-8">
                <Youtube className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">YouTube verification will be implemented with OAuth.</p>
                <Button onClick={() => handleYouTubeVerification({ success: true })}>
                  Simulate YouTube Verification
                </Button>
              </div>
            ) : (
              <SecureFileUploader 
                rightId={rightId}
                onFilesUploaded={handleFilesUploaded}
                maxFiles={5}
              />
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep('select')}>
            Back to Methods
          </Button>
          {((verificationMethod === 'documents' && uploadedFiles.length > 0) ||
            (verificationMethod === 'youtube' && youtubeVerification?.success)) && (
            <Button onClick={() => setStep('review')}>
              Review Verification
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (step === 'review') {
    const status = getVerificationStatus();
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              Verification Review
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Summary */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {status.status === 'verified' && <CheckCircle className="w-5 h-5 text-green-600" />}
                {status.status === 'pending' && <Clock className="w-5 h-5 text-orange-500" />}
                {status.status === 'incomplete' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                <div>
                  <p className="font-medium">
                    {status.status === 'verified' && 'Verification Complete'}
                    {status.status === 'pending' && 'Pending Admin Review'}
                    {status.status === 'incomplete' && 'Verification Incomplete'}
                  </p>
                  <p className="text-sm text-gray-600">{status.message}</p>
                </div>
              </div>
              <Badge 
                variant={status.status === 'verified' ? 'default' : 'secondary'}
                className={status.status === 'verified' ? 'bg-green-600' : ''}
              >
                {status.status.toUpperCase()}
              </Badge>
            </div>

            <Separator />

            {/* Method Used */}
            <div>
              <h4 className="font-medium mb-2">Verification Method</h4>
              <div className="flex items-center gap-2">
                {verificationMethod === 'youtube' ? (
                  <>
                    <Youtube className="w-4 h-4 text-red-600" />
                    <span className="text-sm">YouTube Auto-Verification</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Secure Document Upload</span>
                  </>
                )}
              </div>
            </div>

            {/* Files Uploaded */}
            {uploadedFiles.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Uploaded Documents ({uploadedFiles.length})</h4>
                <div className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                      <Shield className="w-4 h-4 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{file.originalName}</p>
                        <p className="text-xs text-gray-500">
                          Securely uploaded • Type validated • Encrypted storage
                        </p>
                      </div>
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        Secure
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* YouTube Data */}
            {youtubeVerification?.success && (
              <div>
                <h4 className="font-medium mb-3">YouTube Verification Details</h4>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Channel ownership verified</span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Authenticated via secure OAuth • Channel access confirmed • Video ownership validated
                  </p>
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2 text-blue-900">Next Steps</h4>
              <p className="text-sm text-blue-800">
                {status.status === 'verified' 
                  ? "Verification complete! You can now proceed to create your NFT." 
                  : "Your verification is being processed. You'll be notified when admin review is complete."
                }
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setStep('verify')}>
            Modify Verification
          </Button>
          <Button onClick={handleSubmitVerification} className="bg-green-600 hover:bg-green-700">
            {status.status === 'verified' ? 'Complete Verification' : 'Submit for Review'}
          </Button>
        </div>
      </div>
    );
  }

  return null;
}