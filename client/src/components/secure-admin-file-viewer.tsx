import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { 
  FileText, 
  Shield, 
  Eye, 
  Download, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  User,
  Calendar
} from 'lucide-react';

interface SecureFileMetadata {
  id: string;
  originalName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  securityChecks: {
    typeValidated: boolean;
    sizeValidated: boolean;
    virusScanned: boolean;
    fileHash: string;
  };
  accessInfo: {
    viewedBy?: string;
    viewedAt?: string;
    accessCount: number;
  };
}

interface SecureAdminFileViewerProps {
  rightId: number;
  rightTitle: string;
}

export function SecureAdminFileViewer({ rightId, rightTitle }: SecureAdminFileViewerProps) {
  const [files, setFiles] = useState<SecureFileMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingFile, setViewingFile] = useState<string | null>(null);
  const [fileAccessTokens, setFileAccessTokens] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    loadFileMetadata();
  }, [rightId]);

  const loadFileMetadata = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/file-metadata/${rightId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load file metadata');
      }

      const data = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error('Error loading file metadata:', error);
      setError(error instanceof Error ? error.message : 'Failed to load files');
    } finally {
      setIsLoading(false);
    }
  };

  const generateAccessToken = async (fileId: string): Promise<string | null> => {
    try {
      const response = await fetch(`/api/admin/file-access-token/${fileId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminId: 'admin' })
      });

      if (!response.ok) {
        throw new Error('Failed to generate access token');
      }

      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Error generating access token:', error);
      return null;
    }
  };

  const viewFile = async (file: SecureFileMetadata) => {
    try {
      setViewingFile(file.id);
      
      // Get or generate access token
      let token = fileAccessTokens.get(file.id);
      if (!token) {
        const newToken = await generateAccessToken(file.id);
        if (!newToken) {
          throw new Error('Failed to get file access token');
        }
        token = newToken;
        setFileAccessTokens(prev => new Map(prev).set(file.id, token!));
      }

      // Open file in new window with secure access
      const fileUrl = `/api/admin/secure-file/${file.id}`;
      const newWindow = window.open('', '_blank');
      
      if (newWindow) {
        // Fetch file with token and display
        const response = await fetch(fileUrl, {
          headers: {
            'Authorization': `Bearer ${token!}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to access file');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        if (file.fileType.startsWith('image/')) {
          newWindow.document.write(`
            <html>
              <head>
                <title>${file.originalName} - Secure Admin View</title>
                <style>
                  body { 
                    margin: 0; 
                    background: #000; 
                    display: flex; 
                    justify-content: center; 
                    align-items: center; 
                    min-height: 100vh;
                  }
                  img { max-width: 100%; max-height: 100%; }
                  .header {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    background: rgba(0,0,0,0.8);
                    color: white;
                    padding: 10px;
                    font-family: Arial, sans-serif;
                  }
                </style>
              </head>
              <body>
                <div class="header">
                  🔒 Secure Admin File View: ${file.originalName} (${formatFileSize(file.fileSize)})
                </div>
                <img src="${url}" alt="${file.originalName}" />
              </body>
            </html>
          `);
        } else {
          newWindow.location.href = url;
        }
      }

      // Refresh metadata to show updated access info
      setTimeout(loadFileMetadata, 1000);
    } catch (error) {
      console.error('Error viewing file:', error);
      alert('Failed to view file. Please try again.');
    } finally {
      setViewingFile(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSecurityScore = (checks: SecureFileMetadata['securityChecks']) => {
    const score = [
      checks.typeValidated,
      checks.sizeValidated,
      checks.virusScanned
    ].filter(Boolean).length;
    return Math.round((score / 3) * 100);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading verification files...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="w-4 h-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Verification Files for: {rightTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No verification files uploaded for this right.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {files.map((file) => (
                <Card key={file.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* File Info */}
                      <div className="lg:col-span-2">
                        <div className="flex items-start gap-3">
                          <FileText className="w-5 h-5 text-blue-600 mt-1" />
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{file.originalName}</h4>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              <span>{formatFileSize(file.fileSize)}</span>
                              <span>{file.fileType}</span>
                              <span>
                                <Calendar className="w-3 h-3 inline mr-1" />
                                {new Date(file.uploadedAt).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Security Status */}
                        <div className="mt-3 flex items-center gap-3">
                          <Badge 
                            variant={getSecurityScore(file.securityChecks) === 100 ? "default" : "secondary"}
                            className={getSecurityScore(file.securityChecks) === 100 ? "bg-green-600" : ""}
                          >
                            Security: {getSecurityScore(file.securityChecks)}%
                          </Badge>
                          
                          <div className="flex items-center gap-1">
                            {file.securityChecks.typeValidated && <CheckCircle className="w-3 h-3 text-green-600" />}
                            {file.securityChecks.sizeValidated && <CheckCircle className="w-3 h-3 text-green-600" />}
                            {!file.securityChecks.virusScanned && <Clock className="w-3 h-3 text-orange-500" />}
                          </div>
                        </div>

                        {/* Access Info */}
                        {file.accessInfo.viewedBy && (
                          <div className="mt-2 text-xs text-gray-500">
                            <User className="w-3 h-3 inline mr-1" />
                            Last viewed by {file.accessInfo.viewedBy} on {new Date(file.accessInfo.viewedAt!).toLocaleString()}
                            ({file.accessInfo.accessCount} total views)
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => viewFile(file)}
                          disabled={viewingFile === file.id}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {viewingFile === file.id ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                              Loading...
                            </>
                          ) : (
                            <>
                              <Eye className="w-3 h-3 mr-2" />
                              Secure View
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Alert>
        <Shield className="w-4 h-4" />
        <AlertDescription>
          <strong>Admin Security Notice:</strong> All file access is logged and monitored. Files are encrypted 
          and require admin authentication tokens. Ensure you have authorization to view these verification documents.
        </AlertDescription>
      </Alert>
    </div>
  );
}