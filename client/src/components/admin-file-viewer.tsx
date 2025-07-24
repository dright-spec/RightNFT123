import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  File, 
  FileText, 
  Image, 
  Music, 
  Video, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Download,
  Scan,
  Clock,
  AlertTriangle
} from 'lucide-react';

interface SecureFileInfo {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  hash: string;
  uploadTime: string;
  isVerified: boolean;
  virusScanResult?: 'clean' | 'infected' | 'pending';
  previewAvailable: boolean;
  userId?: number;
}

interface FilePreview {
  previewType: 'image' | 'pdf' | 'text' | 'unsupported';
  previewData?: string;
  error?: string;
}

export default function AdminFileViewer() {
  const { toast } = useToast();
  const [files, setFiles] = useState<SecureFileInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<SecureFileInfo | null>(null);
  const [preview, setPreview] = useState<FilePreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  useEffect(() => {
    loadFiles();
  }, []);

  const loadFiles = async () => {
    try {
      const response = await fetch('/api/secure-files/admin/files', {
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (result.success) {
        setFiles(result.data);
      } else {
        toast({
          title: "Failed to Load Files",
          description: result.error || 'Unknown error',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading files:', error);
      toast({
        title: "Network Error",
        description: "Failed to connect to server",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString();
  };

  const verifyFile = async (fileId: string, verified: boolean) => {
    try {
      const response = await fetch(`/api/secure-files/admin/verify/${fileId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ verified }),
        credentials: 'include'
      });

      const result = await response.json();

      if (result.success) {
        setFiles(prev => prev.map(file => 
          file.id === fileId 
            ? { ...file, isVerified: verified }
            : file
        ));

        toast({
          title: verified ? "File Approved" : "File Rejected",
          description: `File has been ${verified ? 'approved' : 'rejected'} successfully`
        });
      } else {
        toast({
          title: "Verification Failed",
          description: result.error || 'Unknown error',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error verifying file:', error);
      toast({
        title: "Network Error",
        description: "Failed to verify file",
        variant: "destructive"
      });
    }
  };

  const previewFile = async (file: SecureFileInfo) => {
    if (!file.previewAvailable) {
      toast({
        title: "Preview Not Available",
        description: "This file type cannot be previewed safely",
        variant: "destructive"
      });
      return;
    }

    setSelectedFile(file);
    setPreviewLoading(true);
    setIsPreviewOpen(true);
    setPreview(null);

    try {
      const response = await fetch(`/api/secure-files/admin/preview/${file.id}`, {
        credentials: 'include'
      });

      const result = await response.json();

      if (result.success) {
        setPreview(result.data);
      } else {
        setPreview({
          previewType: 'unsupported',
          error: result.error || 'Preview generation failed'
        });
      }
    } catch (error) {
      console.error('Error loading preview:', error);
      setPreview({
        previewType: 'unsupported',
        error: 'Network error while loading preview'
      });
    } finally {
      setPreviewLoading(false);
    }
  };

  const renderPreview = () => {
    if (previewLoading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="text-sm text-muted-foreground">Generating secure preview...</p>
          </div>
        </div>
      );
    }

    if (!preview) return null;

    if (preview.error) {
      return (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{preview.error}</AlertDescription>
        </Alert>
      );
    }

    switch (preview.previewType) {
      case 'image':
        return (
          <div className="flex justify-center">
            <img 
              src={preview.previewData} 
              alt="File preview"
              className="max-w-full max-h-96 object-contain rounded-lg border"
            />
          </div>
        );

      case 'pdf':
        return (
          <div className="h-96 border rounded-lg">
            <iframe
              src={`data:application/pdf;base64,${preview.previewData}`}
              className="w-full h-full rounded-lg"
              title="PDF Preview"
            />
          </div>
        );

      case 'text':
        return (
          <div className="h-96 border rounded-lg p-4 bg-muted overflow-auto">
            <pre className="text-sm whitespace-pre-wrap font-mono">
              {preview.previewData}
            </pre>
          </div>
        );

      default:
        return (
          <Alert>
            <File className="h-4 w-4" />
            <AlertDescription>
              Preview not available for this file type. File has been scanned and is safe to review.
            </AlertDescription>
          </Alert>
        );
    }
  };

  const getStatusBadge = (file: SecureFileInfo) => {
    const badges = [];

    // Verification status
    if (file.isVerified) {
      badges.push(
        <Badge key="verified" variant="default" className="bg-green-600">
          <CheckCircle className="w-3 h-3 mr-1" />
          Verified
        </Badge>
      );
    } else {
      badges.push(
        <Badge key="pending" variant="secondary">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    }

    // Virus scan status
    if (file.virusScanResult === 'clean') {
      badges.push(
        <Badge key="clean" variant="outline" className="text-green-600 border-green-600">
          <Scan className="w-3 h-3 mr-1" />
          Clean
        </Badge>
      );
    } else if (file.virusScanResult === 'infected') {
      badges.push(
        <Badge key="infected" variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Infected
        </Badge>
      );
    }

    return badges;
  };

  const filteredFiles = (status: 'all' | 'pending' | 'verified' | 'infected') => {
    switch (status) {
      case 'pending':
        return files.filter(f => !f.isVerified && f.virusScanResult !== 'infected');
      case 'verified':
        return files.filter(f => f.isVerified);
      case 'infected':
        return files.filter(f => f.virusScanResult === 'infected');
      default:
        return files;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="text-sm text-muted-foreground">Loading files...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Secure File Management</h2>
          <p className="text-muted-foreground">
            Review and verify uploaded documents safely without downloading
          </p>
        </div>
        <Button onClick={loadFiles} variant="outline">
          Refresh
        </Button>
      </div>

      {/* File Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">
            All Files ({files.length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({filteredFiles('pending').length})
          </TabsTrigger>
          <TabsTrigger value="verified">
            Verified ({filteredFiles('verified').length})
          </TabsTrigger>
          {filteredFiles('infected').length > 0 && (
            <TabsTrigger value="infected">
              Infected ({filteredFiles('infected').length})
            </TabsTrigger>
          )}
        </TabsList>

        {(['all', 'pending', 'verified', 'infected'] as const).map(status => (
          <TabsContent key={status} value={status} className="space-y-4">
            {filteredFiles(status).length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">No files found</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredFiles(status).map(file => (
                  <Card key={file.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between space-x-4">
                        <div className="flex items-start space-x-3 flex-1 min-w-0">
                          <div className="flex-shrink-0 p-2 bg-muted rounded-lg">
                            {getFileIcon(file.mimeType)}
                          </div>
                          
                          <div className="flex-1 min-w-0 space-y-2">
                            <div>
                              <h3 className="font-medium truncate">{file.originalName}</h3>
                              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                <span>{formatFileSize(file.size)}</span>
                                <span>•</span>
                                <span>{file.mimeType}</span>
                                <span>•</span>
                                <span>{formatDate(file.uploadTime)}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              {getStatusBadge(file)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {file.previewAvailable && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => previewFile(file)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </Button>
                          )}
                          
                          {!file.isVerified && file.virusScanResult !== 'infected' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => verifyFile(file.id, true)}
                                className="text-green-600 border-green-600 hover:bg-green-50"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Approve
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => verifyFile(file.id, false)}
                                className="text-red-600 border-red-600 hover:bg-red-50"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                            </>
                          )}
                          
                          {file.isVerified && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => verifyFile(file.id, false)}
                              className="text-orange-600 border-orange-600 hover:bg-orange-50"
                            >
                              Revoke
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <span>Secure File Preview</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedFile && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">File:</span> {selectedFile.originalName}
                  </div>
                  <div>
                    <span className="font-medium">Size:</span> {formatFileSize(selectedFile.size)}
                  </div>
                  <div>
                    <span className="font-medium">Type:</span> {selectedFile.mimeType}
                  </div>
                  <div>
                    <span className="font-medium">Uploaded:</span> {formatDate(selectedFile.uploadTime)}
                  </div>
                </div>
              </div>
              
              {renderPreview()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}