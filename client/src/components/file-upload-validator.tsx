import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, FileText, Image, FileVideo, FileAudio, CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react";

interface FileUploadValidatorProps {
  rightType: string;
  onFilesValidated: (files: ValidatedFile[]) => void;
  required?: boolean;
}

interface ValidatedFile {
  file: File;
  type: 'content' | 'ownership' | 'legal';
  hash: string;
  validated: boolean;
  metadata?: any;
}

export function FileUploadValidator({ rightType, onFilesValidated, required = false }: FileUploadValidatorProps) {
  const [files, setFiles] = useState<ValidatedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const contentFileRef = useRef<HTMLInputElement>(null);
  const ownershipFileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const allowedFileTypes = {
    content: {
      copyright: ['image/*', 'video/*', 'audio/*', '.pdf', '.doc', '.docx'],
      royalty: ['image/*', 'video/*', 'audio/*', '.pdf'],
      access: ['image/*', '.pdf', '.doc', '.docx'],
      ownership: ['image/*', '.pdf', '.doc', '.docx'],
      license: ['image/*', '.pdf', '.doc', '.docx']
    },
    ownership: ['.pdf', '.doc', '.docx', 'image/*'],
    legal: ['.pdf', '.doc', '.docx']
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return Image;
    if (fileType.startsWith('video/')) return FileVideo;
    if (fileType.startsWith('audio/')) return FileAudio;
    return FileText;
  };

  const calculateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const validateFile = async (file: File, type: 'content' | 'ownership' | 'legal'): Promise<ValidatedFile> => {
    const hash = await calculateFileHash(file);
    
    // Basic validation
    const maxSize = type === 'content' ? 100 * 1024 * 1024 : 10 * 1024 * 1024; // 100MB for content, 10MB for others
    if (file.size > maxSize) {
      throw new Error(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
    }

    // Type validation
    const allowedTypes = type === 'content' ? allowedFileTypes.content[rightType as keyof typeof allowedFileTypes.content] : allowedFileTypes[type];
    const isValidType = allowedTypes.some(allowedType => {
      if (allowedType.includes('*')) {
        return file.type.startsWith(allowedType.split('*')[0]);
      }
      return file.name.toLowerCase().endsWith(allowedType);
    });

    if (!isValidType) {
      throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
    }

    return {
      file,
      type,
      hash,
      validated: true,
      metadata: {
        size: file.size,
        lastModified: file.lastModified,
        name: file.name
      }
    };
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'content' | 'ownership' | 'legal') => {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const validatedFiles: ValidatedFile[] = [];
      const totalFiles = selectedFiles.length;

      for (let i = 0; i < totalFiles; i++) {
        const file = selectedFiles[i];
        setUploadProgress((i / totalFiles) * 100);

        try {
          const validatedFile = await validateFile(file, type);
          validatedFiles.push(validatedFile);
        } catch (error) {
          toast({
            title: `File validation failed: ${file.name}`,
            description: error instanceof Error ? error.message : 'Unknown error',
            variant: "destructive",
          });
        }
      }

      setUploadProgress(100);
      
      const updatedFiles = [...files.filter(f => f.type !== type), ...validatedFiles];
      setFiles(updatedFiles);
      onFilesValidated(updatedFiles);

      if (validatedFiles.length > 0) {
        toast({
          title: "Files uploaded successfully",
          description: `${validatedFiles.length} file(s) validated and ready for submission`,
        });
      }

    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = (hash: string) => {
    const updatedFiles = files.filter(f => f.hash !== hash);
    setFiles(updatedFiles);
    onFilesValidated(updatedFiles);
  };

  const getUploadInstructions = () => {
    switch (rightType) {
      case 'copyright':
        return {
          content: 'Upload the original creative work (image, video, audio, or document)',
          ownership: 'Provide copyright certificates, creation timestamps, or registration documents'
        };
      case 'royalty':
        return {
          content: 'Upload examples of the asset generating royalties',
          ownership: 'Provide royalty agreements, contracts, or revenue statements'
        };
      case 'access':
        return {
          content: 'Upload materials showing the exclusive access being granted',
          ownership: 'Provide access agreements, membership documents, or authorization letters'
        };
      case 'ownership':
        return {
          content: 'Upload images or documents of the asset',
          ownership: 'Provide ownership certificates, deeds, or purchase agreements'
        };
      case 'license':
        return {
          content: 'Upload the content being licensed',
          ownership: 'Provide licensing agreements, terms of use, or authorization documents'
        };
      default:
        return {
          content: 'Upload your content files',
          ownership: 'Upload ownership verification documents'
        };
    }
  };

  const instructions = getUploadInstructions();
  const contentFiles = files.filter(f => f.type === 'content');
  const ownershipFiles = files.filter(f => f.type === 'ownership');
  const hasRequiredFiles = contentFiles.length > 0 || ownershipFiles.length > 0;

  return (
    <div className="space-y-6">
      {/* Upload Progress */}
      {uploading && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-medium">Validating files...</span>
            </div>
            <Progress value={uploadProgress} className="mb-2" />
            <p className="text-sm text-muted-foreground">
              Checking file integrity and validity...
            </p>
          </CardContent>
        </Card>
      )}

      {/* Content Files */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Content Files
            {required && <Badge variant="outline">Required</Badge>}
          </CardTitle>
          <CardDescription>
            {instructions.content}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
            onClick={() => contentFileRef.current?.click()}
          >
            {contentFiles.length > 0 ? (
              <div className="space-y-3">
                {contentFiles.map((validatedFile) => {
                  const Icon = getFileIcon(validatedFile.file.type);
                  return (
                    <div key={validatedFile.hash} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <div className="text-left">
                          <p className="font-medium text-sm">{validatedFile.file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(validatedFile.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(validatedFile.hash);
                          }}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                <Button variant="outline" size="sm">
                  Add More Files
                </Button>
              </div>
            ) : (
              <div>
                <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-1">
                  Click to upload content files
                </p>
                <p className="text-xs text-muted-foreground">
                  Supported: {allowedFileTypes.content[rightType as keyof typeof allowedFileTypes.content]?.join(', ')}
                </p>
              </div>
            )}
          </div>
          <input
            ref={contentFileRef}
            type="file"
            className="hidden"
            multiple
            accept={allowedFileTypes.content[rightType as keyof typeof allowedFileTypes.content]?.join(',')}
            onChange={(e) => handleFileUpload(e, 'content')}
          />
        </CardContent>
      </Card>

      {/* Ownership Verification Files */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Ownership Verification
            <Badge variant="outline">Required</Badge>
          </CardTitle>
          <CardDescription>
            {instructions.ownership}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
            onClick={() => ownershipFileRef.current?.click()}
          >
            {ownershipFiles.length > 0 ? (
              <div className="space-y-3">
                {ownershipFiles.map((validatedFile) => {
                  const Icon = getFileIcon(validatedFile.file.type);
                  return (
                    <div key={validatedFile.hash} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <div className="text-left">
                          <p className="font-medium text-sm">{validatedFile.file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(validatedFile.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeFile(validatedFile.hash);
                          }}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
                <Button variant="outline" size="sm">
                  Add More Documents
                </Button>
              </div>
            ) : (
              <div>
                <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-1">
                  Click to upload ownership documents
                </p>
                <p className="text-xs text-muted-foreground">
                  Supported: PDF, DOC, DOCX, Images
                </p>
              </div>
            )}
          </div>
          <input
            ref={ownershipFileRef}
            type="file"
            className="hidden"
            multiple
            accept={allowedFileTypes.ownership.join(',')}
            onChange={(e) => handleFileUpload(e, 'ownership')}
          />
        </CardContent>
      </Card>

      {/* Validation Status */}
      {files.length > 0 && (
        <Alert>
          <CheckCircle className="w-4 h-4" />
          <AlertDescription>
            {files.length} file(s) uploaded and validated. 
            {!hasRequiredFiles && " Upload ownership documents to proceed with verification."}
          </AlertDescription>
        </Alert>
      )}

      {required && !hasRequiredFiles && (
        <Alert variant="destructive">
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            File uploads are required before you can create this right. Please upload both content and ownership verification files.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}