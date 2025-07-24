import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  File, 
  CheckCircle, 
  AlertCircle, 
  X, 
  Shield, 
  Scan,
  FileText,
  Image,
  Music,
  Video
} from 'lucide-react';

interface UploadedFile {
  id?: string;
  originalName: string;
  size: number;
  mimeType?: string;
  uploadProgress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  isVerified?: boolean;
  virusScanResult?: 'clean' | 'infected' | 'pending';
}

interface SecureFileUploadProps {
  onUploadComplete?: (files: UploadedFile[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  className?: string;
}

export default function SecureFileUpload({
  onUploadComplete,
  maxFiles = 10,
  acceptedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'audio/mpeg',
    'audio/wav',
    'video/mp4',
    'text/plain'
  ],
  className = ''
}: SecureFileUploadProps) {
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (mimeType.startsWith('audio/')) return <Music className="w-4 h-4" />;
    if (mimeType.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (mimeType === 'application/pdf') return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    // Check file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      return 'File size exceeds 50MB limit';
    }

    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return `File type ${file.type} not supported`;
    }

    // Check for malicious extensions
    const maliciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.js'];
    const fileName = file.name.toLowerCase();
    for (const ext of maliciousExtensions) {
      if (fileName.endsWith(ext)) {
        return 'Potentially dangerous file type detected';
      }
    }

    return null;
  };

  const handleFileSelect = useCallback((selectedFiles: FileList) => {
    const newFiles: UploadedFile[] = [];
    const errors: string[] = [];

    // Check total file count
    if (files.length + selectedFiles.length > maxFiles) {
      errors.push(`Maximum ${maxFiles} files allowed`);
    }

    for (let i = 0; i < Math.min(selectedFiles.length, maxFiles - files.length); i++) {
      const file = selectedFiles[i];
      const validationError = validateFile(file);

      if (validationError) {
        errors.push(`${file.name}: ${validationError}`);
        continue;
      }

      newFiles.push({
        originalName: file.name,
        size: file.size,
        mimeType: file.type,
        uploadProgress: 0,
        status: 'uploading'
      });
    }

    if (errors.length > 0) {
      toast({
        title: "File Validation Errors",
        description: errors.join(', '),
        variant: "destructive"
      });
    }

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
      uploadFiles(selectedFiles, newFiles);
    }
  }, [files.length, maxFiles, acceptedTypes, toast]);

  const uploadFiles = async (fileList: FileList, uploadItems: UploadedFile[]) => {
    setIsUploading(true);

    try {
      const formData = new FormData();
      
      for (let i = 0; i < Math.min(fileList.length, uploadItems.length); i++) {
        formData.append('files', fileList[i]);
      }

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(file => {
          if (file.status === 'uploading' && file.uploadProgress < 90) {
            return { ...file, uploadProgress: file.uploadProgress + 10 };
          }
          return file;
        }));
      }, 200);

      const response = await fetch('/api/secure-files/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      clearInterval(progressInterval);

      const result = await response.json();

      if (result.success) {
        setFiles(prev => prev.map(file => {
          if (file.status === 'uploading') {
            const uploadedFile = result.data.uploadedFiles.find(
              (f: any) => !f.failed && f.originalName === file.originalName
            );
            
            if (uploadedFile) {
              return {
                ...file,
                id: uploadedFile.id,
                uploadProgress: 100,
                status: 'success',
                isVerified: uploadedFile.isVerified,
                virusScanResult: uploadedFile.virusScanResult
              };
            } else {
              const failedFile = result.data.uploadedFiles.find(
                (f: any) => f.failed && f.originalName === file.originalName
              );
              return {
                ...file,
                uploadProgress: 100,
                status: 'error',
                error: failedFile?.error || 'Upload failed'
              };
            }
          }
          return file;
        }));

        toast({
          title: "Upload Complete",
          description: `${result.data.successfulUploads} of ${result.data.totalFiles} files uploaded successfully`
        });

        if (onUploadComplete) {
          const successfulFiles = files.filter(f => f.status === 'success');
          onUploadComplete(successfulFiles);
        }
      } else {
        // Mark all uploading files as failed
        setFiles(prev => prev.map(file => 
          file.status === 'uploading' 
            ? { ...file, status: 'error', error: result.error || 'Upload failed' }
            : file
        ));

        toast({
          title: "Upload Failed",
          description: result.error || 'Unknown error occurred',
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      
      setFiles(prev => prev.map(file => 
        file.status === 'uploading' 
          ? { ...file, status: 'error', error: 'Network error' }
          : file
      ));

      toast({
        title: "Upload Failed",
        description: "Network error occurred during upload",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles);
    }
  }, [handleFileSelect]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFileSelect(selectedFiles);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Files are securely processed with virus scanning, encryption, and safe preview generation. 
          Only approved file types are accepted.
        </AlertDescription>
      </Alert>

      {/* Upload Area */}
      <Card 
        className={`transition-colors duration-200 ${
          isDragging 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
            : 'border-dashed border-gray-300 dark:border-gray-600'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardContent className="p-8 text-center">
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
              <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            
            <div>
              <h3 className="text-lg font-semibold">Upload Documents</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Drag and drop files here, or click to browse
              </p>
            </div>

            <div className="space-y-2 text-xs text-muted-foreground">
              <p>Supported: PDF, Images, Audio, Video, Text documents</p>
              <p>Maximum: {maxFiles} files, 50MB each</p>
            </div>

            <Button 
              variant="outline" 
              onClick={() => document.getElementById('file-input')?.click()}
              disabled={isUploading || files.length >= maxFiles}
            >
              Choose Files
            </Button>

            <input
              id="file-input"
              type="file"
              multiple
              accept={acceptedTypes.join(',')}
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Uploaded Files ({files.length}/{maxFiles})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {files.map((file, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  {file.mimeType && getFileIcon(file.mimeType)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {file.originalName}
                    </p>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>{formatFileSize(file.size)}</span>
                      {file.mimeType && (
                        <Badge variant="outline" className="text-xs">
                          {file.mimeType.split('/')[1].toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status indicators */}
                <div className="flex items-center space-x-2">
                  {file.status === 'uploading' && (
                    <div className="w-20">
                      <Progress value={file.uploadProgress} className="h-2" />
                    </div>
                  )}
                  
                  {file.status === 'success' && (
                    <div className="flex items-center space-x-1">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      {file.virusScanResult === 'clean' && (
                        <Scan className="w-4 h-4 text-green-600" title="Virus scan passed" />
                      )}
                      {file.isVerified && (
                        <Shield className="w-4 h-4 text-blue-600" title="Admin verified" />
                      )}
                    </div>
                  )}
                  
                  {file.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-600" title={file.error} />
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upload Status */}
      {isUploading && (
        <Alert>
          <Upload className="h-4 w-4 animate-pulse" />
          <AlertDescription>
            Processing files... Please wait while we scan and encrypt your documents.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}